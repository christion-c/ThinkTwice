import { act, renderHook } from "@testing-library/react-native";
import type { User } from "firebase/auth";

import { useMlPreview } from "./useMlPreview";
import { fetchMlPreview, type MlPreviewResponse } from "@/lib/api/ml-preview";

jest.mock("@/lib/api/ml-preview", () => ({
  fetchMlPreview: jest.fn(),
}));

const mockedFetchMlPreview = fetchMlPreview as jest.MockedFunction<typeof fetchMlPreview>;

const fakeUser = { uid: "user-1" } as User;

function makeResponse(overrides: Partial<MlPreviewResponse> = {}): MlPreviewResponse {
  return {
    rows: 30,
    history_count: 0,
    next_week: { miles_driven: 120 },
    fuel_prediction: 42,
    total_prediction: 42,
    feedback: "feedback",
    explanation: "explanation",
    sample_rows: [],
    ...overrides,
  };
}

// This RTL version's renderHook/act are both async (they return
// Promises even for synchronous callbacks), matching the pattern
// already established in useStepFlow.test.ts. The hook's own
// mount-time effect resolves its mocked fetch a microtask or two after
// renderHook returns, which React logs as an act() warning here (state
// updating slightly outside the tracked window) even though every
// assertion below still runs only after that update has landed -
// harmless test-only console noise, not a sign of a flaky assertion.
describe("useMlPreview", () => {
  beforeEach(() => {
    mockedFetchMlPreview.mockReset();
  });

  it("surfaces a sign-in error and never calls the API when there is no user", async () => {
    const { result } = await renderHook(() => useMlPreview(null));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Sign in to load a preview.");
    expect(mockedFetchMlPreview).not.toHaveBeenCalled();
  });

  it("loads successfully on mount for a signed-in user", async () => {
    mockedFetchMlPreview.mockResolvedValue(makeResponse({ fuel_prediction: 55 }));

    const { result } = await renderHook(() => useMlPreview(fakeUser));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data?.fuel_prediction).toBe(55);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("surfaces the fetch error message when there is no prior data", async () => {
    mockedFetchMlPreview.mockRejectedValue(new Error("service down"));

    const { result } = await renderHook(() => useMlPreview(fakeUser));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("service down");
    expect(result.current.loading).toBe(false);
  });

  it("ignores a stale response when a newer request has already started", async () => {
    let resolveFirst: (value: MlPreviewResponse) => void = () => {};
    const firstCall = new Promise<MlPreviewResponse>((resolve) => {
      resolveFirst = resolve;
    });
    mockedFetchMlPreview.mockReturnValueOnce(firstCall);
    mockedFetchMlPreview.mockResolvedValueOnce(makeResponse({ fuel_prediction: 200 }));

    const { result } = await renderHook(() => useMlPreview(fakeUser));

    // Trigger a second, newer request before the first (mount) request resolves.
    await act(async () => {
      await result.current.reload("200");
    });

    expect(result.current.data?.fuel_prediction).toBe(200);

    // Now let the first, now-stale request resolve - it must not
    // overwrite the newer result that already landed.
    await act(async () => {
      resolveFirst(makeResponse({ fuel_prediction: 999 }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data?.fuel_prediction).toBe(200);
  });

  it("suppresses an error from a later failed reload once data has already loaded once", async () => {
    mockedFetchMlPreview.mockResolvedValueOnce(makeResponse({ fuel_prediction: 10 }));

    const { result } = await renderHook(() => useMlPreview(fakeUser));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.data?.fuel_prediction).toBe(10);

    mockedFetchMlPreview.mockRejectedValueOnce(new Error("transient failure"));

    await act(async () => {
      await result.current.reload("150");
    });

    // Data already arrived once, so a later failure is swallowed rather
    // than surfaced as an error - the stale-but-still-good data stays.
    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.data?.fuel_prediction).toBe(10);
  });

  it("only surfaces the warm-up error after the delay elapses with nothing loaded yet", async () => {
    jest.useFakeTimers();
    let resolveCall: (value: MlPreviewResponse) => void = () => {};
    mockedFetchMlPreview.mockReturnValue(
      new Promise<MlPreviewResponse>((resolve) => {
        resolveCall = resolve;
      }),
    );

    const { result } = await renderHook(() => useMlPreview(fakeUser));

    expect(result.current.error).toBe("");

    await act(async () => {
      jest.advanceTimersByTime(29999);
    });
    expect(result.current.error).toBe("");

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.error).toBe("Preview service is still warming up. Please wait a moment.");
    expect(result.current.loading).toBe(false);

    // Clean up the still-pending mocked call so it doesn't leak into
    // another test.
    resolveCall(makeResponse());
    jest.useRealTimers();
  });
});
