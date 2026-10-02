import { act, render } from "@testing-library/react-native";
import { useEffect } from "react";

import { FinanceProvider, useFinance } from "./FinanceProvider";
import * as backendApi from "@/lib/backend-api";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockUser = { uid: "user-1" };
jest.mock("./AuthProvider", () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock("./VehicleProvider", () => ({ useVehicle: () => ({ selectedVehicle: null }) }));

jest.mock("@/lib/backend-api", () => ({
  fetchFinanceInputs: jest.fn(),
  upsertFinanceInputs: jest.fn(() => Promise.resolve()),
  fetchFillUpHistory: jest.fn(() => Promise.resolve([])),
  fetchDailyDrivingLogs: jest.fn(() => Promise.resolve([])),
}));

const api = backendApi as jest.Mocked<typeof backendApi>;

const savedInputs = {
  incomeInput: "4200",
  expenseInput: "900",
  monthlyFixedCostsInput: "1500",
  fuelGallonsInput: "12",
  fuelPriceInput: "3.40",
  milesPerWeekInput: "180",
  combinedMpgInput: "30",
  tankCapacityInput: "14",
  currentTankPercentInput: "50",
};

let finance: ReturnType<typeof useFinance> | null = null;

// Hands the latest context value to the test after each render.
function Capture({ onValue }: { onValue: (value: ReturnType<typeof useFinance>) => void }) {
  const value = useFinance();
  useEffect(() => {
    onValue(value);
  });
  return null;
}

const capture = (value: ReturnType<typeof useFinance>) => {
  finance = value;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  finance = null;
});

afterEach(() => {
  jest.useRealTimers();
});

// Signing in on a new device: the server is slow (e.g. a cold start)
// and takes longer than the 1.5s save debounce to return the account's
// inputs. The blank defaults on screen meanwhile must never be uploaded
// over the real values.
test("does not upload blank inputs while the server copy is still loading", async () => {
  let resolveFetch: (value: typeof savedInputs) => void = () => {};
  api.fetchFinanceInputs.mockReturnValue(new Promise((resolve) => (resolveFetch = resolve)));

  await render(
    <FinanceProvider>
      <Capture onValue={capture} />
    </FinanceProvider>,
  );

  await act(async () => {
    jest.advanceTimersByTime(5000);
  });
  expect(api.upsertFinanceInputs).not.toHaveBeenCalled();

  await act(async () => {
    resolveFetch(savedInputs);
  });
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  // Loaded values are shown and not echoed straight back to the server.
  expect(finance?.incomeInput).toBe("4200");
  expect(api.upsertFinanceInputs).not.toHaveBeenCalled();
});

test("uploads the user's edits once the server copy has loaded", async () => {
  api.fetchFinanceInputs.mockResolvedValue(savedInputs);

  await render(
    <FinanceProvider>
      <Capture onValue={capture} />
    </FinanceProvider>,
  );
  await act(async () => {});

  await act(async () => {
    finance?.setIncomeInput("5000");
  });
  await act(async () => {
    jest.advanceTimersByTime(1500);
  });

  expect(api.upsertFinanceInputs).toHaveBeenCalledTimes(1);
  expect(api.upsertFinanceInputs).toHaveBeenCalledWith(
    mockUser,
    expect.objectContaining({ incomeInput: "5000", expenseInput: "900" }),
  );
});

test("never uploads when the server copy fails to load", async () => {
  api.fetchFinanceInputs.mockRejectedValue(new Error("offline"));

  await render(
    <FinanceProvider>
      <Capture onValue={capture} />
    </FinanceProvider>,
  );
  await act(async () => {});

  await act(async () => {
    finance?.setIncomeInput("123");
  });
  await act(async () => {
    jest.advanceTimersByTime(5000);
  });

  expect(api.upsertFinanceInputs).not.toHaveBeenCalled();
});
