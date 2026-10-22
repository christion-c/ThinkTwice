// Calls the ThinkTwice API as the signed-in user. Responses are checked against the shared schemas.
import * as z from "zod";

import { getConfig } from "./config";
import { getFirebaseAuth } from "./firebase";

const apiErrorBodySchema = z.object({
  error: z.object({ code: z.string(), message: z.string() }),
});

const NETWORK_ERROR_MESSAGE =
  "We couldn't reach ThinkTwice. Check your connection and try again.";
const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

/** An API failure with a message that's safe to show to the user. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  /** Creates an error whose message is meant for the user. */
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions<Result> {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Validates and types a successful response. Omit for responses without a body (e.g. 204). */
  schema?: z.ZodType<Result>;
}

/** Turns a failed response into an ApiError, using the API's own friendly message when it sends one. */
async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => null);
  const parsed = apiErrorBodySchema.safeParse(body);
  return parsed.success
    ? new ApiError(
        response.status,
        parsed.data.error.code,
        parsed.data.error.message,
      )
    : new ApiError(
        response.status,
        "UNEXPECTED_RESPONSE",
        UNEXPECTED_ERROR_MESSAGE,
      );
}

/** Sends a request to the API with the signed-in user's ID token and returns the validated response. */
export async function apiRequest<Result = undefined>(
  path: string,
  { method = "GET", body, schema }: RequestOptions<Result> = {},
): Promise<Result> {
  const user = getFirebaseAuth().currentUser;
  if (user === null) {
    throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  }
  const token = await user.getIdToken();

  let response: Response;
  try {
    response = await fetch(`${getConfig().apiUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }
  if (schema === undefined) {
    return undefined as Result;
  }
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ApiError(
      response.status,
      "UNEXPECTED_RESPONSE",
      UNEXPECTED_ERROR_MESSAGE,
    );
  }
  return parsed.data;
}
