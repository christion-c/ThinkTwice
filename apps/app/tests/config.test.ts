import { resolveApiUrl } from "../src/lib/config";

describe("resolveApiUrl", () => {
  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
  ])("points %s at the computer running the Android emulator", (url) => {
    expect(resolveApiUrl(url, "android")).toMatch(
      /^http:\/\/10\.0\.2\.2(:3000)?$/,
    );
  });

  it("leaves other hosts alone on Android", () => {
    expect(resolveApiUrl("https://api.thinktwice.site", "android")).toBe(
      "https://api.thinktwice.site",
    );
    expect(resolveApiUrl("http://localhostess.example", "android")).toBe(
      "http://localhostess.example",
    );
  });

  it.each(["ios", "web"])("leaves localhost alone on %s", (platform) => {
    expect(resolveApiUrl("http://localhost:3000", platform)).toBe(
      "http://localhost:3000",
    );
  });
});
