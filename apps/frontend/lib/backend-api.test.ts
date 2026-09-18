// requestBackend is the single choke point every API call in the app
// funnels through, so it's tested in isolation here rather than only
// indirectly through whichever higher-level function happens to call
// it. apiBaseUrl is derived from EXPO_PUBLIC_API_URL at module load
// time, so the env var has to be set and the module graph reset before
// importing it - jest.isolateModules (sync, plain require - this
// project's babel-jest setup transforms to CommonJS, and a dynamic
// import() here doesn't survive that transform) keeps that setup
// contained to this file instead of leaking into every other test file
// that imports backend-api.ts for its (unrelated) types.
describe("requestBackend", () => {
  let requestBackend: typeof import("./backend-api").requestBackend;
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const originalFetch = globalThis.fetch;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.test";
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ requestBackend } = require("./backend-api"));
    });
  });

  afterAll(() => {
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
    globalThis.fetch = jest.fn().mockResolvedValue(response as Response);
  }

  it("returns the parsed JSON body for a successful response", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ hello: "world" }) });

    const result = await requestBackend("/ping", { method: "GET" });

    expect(result).toEqual({ hello: "world" });
    expect(globalThis.fetch).toHaveBeenCalledWith("https://api.example.test/ping", { method: "GET" });
  });

  it("returns undefined for a 204 No Content response without parsing a body", async () => {
    const json = jest.fn();
    mockFetchOnce({ ok: true, status: 204, json });

    const result = await requestBackend("/ping", { method: "DELETE" });

    expect(result).toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it("throws the server's error message for a non-2xx response with a parseable body", async () => {
    mockFetchOnce({ ok: false, status: 400, json: async () => ({ error: "Invalid input" }) });

    await expect(requestBackend("/ping", { method: "POST" })).rejects.toThrow("Invalid input");
  });

  it("falls back to a generic status-based message when the error body isn't parseable JSON", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(requestBackend("/ping", { method: "GET" })).rejects.toThrow(
      "Request failed with status 500",
    );
  });

  it("falls back to the generic message when the error body has no error field", async () => {
    mockFetchOnce({ ok: false, status: 403, json: async () => ({}) });

    await expect(requestBackend("/ping", { method: "GET" })).rejects.toThrow(
      "Request failed with status 403",
    );
  });
});
