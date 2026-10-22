import { userProfileSchema } from "@thinktwice/shared";

import { ApiError, apiRequest } from "../src/lib/api";
import { getFirebaseAuth } from "../src/lib/firebase";

jest.mock("../src/lib/config", () => ({
  getConfig: () => ({ apiUrl: "http://api.test" }),
}));
jest.mock("../src/lib/firebase", () => ({ getFirebaseAuth: jest.fn() }));

const PROFILE = {
  id: "0199f3c2-7c1e-7a3b-9d2e-1234567890ab",
  email: "alex@example.com",
  timezone: "America/Chicago",
  monthlyBudgetCents: null,
  createdAt: "2026-10-22T14:03:11.000Z",
};

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

/** Makes the mocked Firebase report the given user (or nobody) as signed in. */
function signedInAs(user: { getIdToken: () => Promise<string> } | null) {
  jest
    .mocked(getFirebaseAuth)
    .mockReturnValue({ currentUser: user } as unknown as ReturnType<
      typeof getFirebaseAuth
    >);
}

/** Builds a JSON response. */
function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock;
  signedInAs({ getIdToken: () => Promise.resolve("id-token-123") });
});

describe("apiRequest", () => {
  it("sends the signed-in user's ID token and a JSON body, and validates the response", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, PROFILE));
    const profile = await apiRequest("/me", {
      method: "POST",
      body: { timezone: "UTC" },
      schema: userProfileSchema,
    });
    expect(profile).toEqual(PROFILE);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://api.test/me");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      authorization: "Bearer id-token-123",
      "content-type": "application/json",
    });
    expect(init?.body).toBe(JSON.stringify({ timezone: "UTC" }));
  });

  it("refuses to call the API when nobody is signed in", async () => {
    signedInAs(null);
    await expect(apiRequest("/me")).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes on the API's own friendly error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, {
        error: {
          code: "ACCOUNT_NOT_FOUND",
          message: "Let's finish setting up your account first.",
        },
      }),
    );
    await expect(apiRequest("/me")).rejects.toEqual(
      new ApiError(
        404,
        "ACCOUNT_NOT_FOUND",
        "Let's finish setting up your account first.",
      ),
    );
  });

  it("gives a friendly message when the API can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Network request failed"));
    await expect(apiRequest("/me")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
      message:
        "We couldn't reach ThinkTwice. Check your connection and try again.",
    });
  });

  it("rejects a response that doesn't match the expected shape", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { ...PROFILE, id: "not-a-uuid" }),
    );
    await expect(
      apiRequest("/me", { schema: userProfileSchema }),
    ).rejects.toMatchObject({
      code: "UNEXPECTED_RESPONSE",
    });
  });

  it("never shows an unexpected error body to the user", async () => {
    fetchMock.mockResolvedValue(
      new Response("<html>Bad Gateway</html>", { status: 502 }),
    );
    await expect(apiRequest("/me")).rejects.toMatchObject({
      status: 502,
      message: "Something went wrong. Please try again.",
    });
  });
});
