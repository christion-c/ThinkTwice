import { startRouteFor } from "../src/features/auth/start-route";

describe("startRouteFor", () => {
  it.each([
    ["loading", "/sign-in"],
    ["signedOut", "/sign-in"],
    ["settingUp", "/account-setup"],
    ["setupFailed", "/account-setup"],
    ["ready", "/"],
  ] as const)("sends a %s user to %s", (status, route) => {
    expect(startRouteFor(status)).toBe(route);
  });
});
