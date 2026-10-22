# ThinkTwice API

_Last updated: 2026-10-22._

The REST API in `services/api`. Request and response shapes come from `packages/shared`, so the app and the API always agree.

## Conventions

- **Authentication:** every endpoint requires `Authorization: Bearer <Firebase ID token>` unless marked **public**. Missing or invalid tokens get `401` with a `WWW-Authenticate: Bearer` header (see `docs/architecture.md`, "Authentication").
- **"Me", not IDs:** endpoints about the caller's own account use `/me`. The API never takes a user ID from the client.
- **JSON only**, up to 100 KB per request. Unknown fields in a request body are rejected.
- **Money** is whole cents (`amountCents`, `monthlyBudgetCents`). **Dates** are `YYYY-MM-DD`; timestamps are ISO 8601 in UTC.
- **Errors** always look like `{ "error": { "code": "…", "message": "…" } }`. The message is safe to show to the user. Validation errors (`400`, code `VALIDATION_ERROR`) also include `issues`: `[{ "path": "/field", "message": "…" }]`.

| Status | Code                                                            | Meaning                                                                  |
| ------ | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`, `BAD_REQUEST`, or an endpoint-specific code | The request isn't valid                                                  |
| 401    | `UNAUTHENTICATED`                                               | Missing, expired or invalid sign-in                                      |
| 404    | `NOT_FOUND`, or an endpoint-specific code                       | Doesn't exist, or belongs to someone else                                |
| 413    | `PAYLOAD_TOO_LARGE`                                             | Body over 100 KB                                                         |
| 415    | `UNSUPPORTED_MEDIA_TYPE`                                        | Body isn't JSON                                                          |
| 429    | `RATE_LIMITED`                                                  | Too many requests; see the `Retry-After` header                          |
| 500    | `INTERNAL_ERROR`                                                | Something went wrong on the server (details are only in the server logs) |

## Health

### `GET /health` (public)

Reports that the API is running. `200 { "status": "ok" }`.

## Account

A Firebase sign-in and a ThinkTwice account are separate: after signing in for the first time, the app calls `POST /me` to create the account. Every account endpoint below returns this **profile**:

```json
{
  "id": "0199f3c2-7c1e-7a3b-9d2e-1234567890ab",
  "email": "alex@example.com",
  "timezone": "America/Chicago",
  "monthlyBudgetCents": 200000,
  "createdAt": "2026-10-22T14:03:11.000Z"
}
```

`email` comes from the verified sign-in token and can't be set by the client. `monthlyBudgetCents` is `null` when no budget is set.

### `POST /me`

Creates the signed-in user's account and their 12 default categories, or returns the existing account. Safe to call on every sign-in, and safe to call several times at once: only one account is ever created.

- Body: `{ "timezone": "America/Chicago" }` (an IANA time zone).
- `201` with the profile when the account was created; `200` with the profile when it already existed (the body's time zone is then ignored; use `PATCH /me` to change it).
- `400 EMAIL_REQUIRED` if the sign-in has no email address.

### `GET /me`

- `200` with the profile.
- `404 ACCOUNT_NOT_FOUND` if the user is signed in but hasn't created their account yet; the app should call `POST /me`.

### `PATCH /me`

Updates settings. Send at least one of:

- `timezone`: an IANA time zone.
- `monthlyBudgetCents`: a whole number of cents from 1 to 10,000,000, or `null` to remove the budget.

`200` with the updated profile, or `404 ACCOUNT_NOT_FOUND`.

### `DELETE /me`

Permanently deletes the account and all of its data (categories and expenses). `204` with no body, or `404 ACCOUNT_NOT_FOUND`. The app then deletes the Firebase sign-in account itself.
