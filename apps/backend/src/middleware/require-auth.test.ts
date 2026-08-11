import assert from "node:assert/strict";
import { after, before, mock, test } from "node:test";

import type { DecodedIdToken } from "firebase-admin/auth";
import type { Request, Response } from "express";

const verifyIdToken = mock.fn<(token: string) => Promise<DecodedIdToken>>();

const mockedFirebaseModule = mock.module("../config/firebase.js", {
  namedExports: {
    firebaseAuth: { verifyIdToken },
  },
});

after(() => {
  mockedFirebaseModule.restore();
});

// Imported after mock.module() so the middleware picks up the mocked
// firebaseAuth instead of initializing the real Firebase Admin SDK.
const { requireAuth } = await import("./require-auth.js");

function createResponse() {
  const state: { statusCode?: number; body?: unknown } = {};

  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  } as unknown as Response;

  return { response, state };
}

before(() => {
  verifyIdToken.mock.resetCalls();
});

test("requireAuth rejects a request with no Authorization header", async () => {
  const request = { header: () => undefined } as unknown as Request;
  const { response, state } = createResponse();
  const next = mock.fn();

  await requireAuth(request, response, next);

  assert.equal(state.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test("requireAuth rejects a malformed Authorization header", async () => {
  const request = {
    header: () => "Token abc123",
  } as unknown as Request;
  const { response, state } = createResponse();
  const next = mock.fn();

  await requireAuth(request, response, next);

  assert.equal(state.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});

test("requireAuth attaches the decoded token and calls next() for a valid bearer token", async () => {
  verifyIdToken.mock.mockImplementationOnce(async () => ({
    uid: "user-123",
  }) as DecodedIdToken);

  const request = {
    header: () => "Bearer valid-token",
  } as unknown as Request;
  const { response } = createResponse();
  const next = mock.fn();

  await requireAuth(request, response, next);

  assert.equal(next.mock.callCount(), 1);
  assert.equal(request.auth?.uid, "user-123");
});

test("requireAuth rejects a token that fails verification", async () => {
  verifyIdToken.mock.mockImplementationOnce(async () => {
    throw new Error("invalid token");
  });

  const request = {
    header: () => "Bearer expired-token",
  } as unknown as Request;
  const { response, state } = createResponse();
  const next = mock.fn();

  await requireAuth(request, response, next);

  assert.equal(state.statusCode, 401);
  assert.equal(next.mock.callCount(), 0);
});
