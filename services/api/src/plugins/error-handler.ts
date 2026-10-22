import type { FastifyInstance } from "fastify";
import { hasZodFastifySchemaValidationErrors } from "fastify-type-provider-zod";

interface ClientError {
  code: string;
  message: string;
}

const CLIENT_ERRORS: Partial<Record<number, ClientError>> = {
  400: { code: "BAD_REQUEST", message: "The request couldn't be understood." },
  401: { code: "UNAUTHENTICATED", message: "Please sign in to continue." },
  403: { code: "FORBIDDEN", message: "You don't have access to that." },
  404: { code: "NOT_FOUND", message: "We couldn't find that." },
  413: {
    code: "PAYLOAD_TOO_LARGE",
    message: "That's too much data to send at once.",
  },
  415: {
    code: "UNSUPPORTED_MEDIA_TYPE",
    message: "Please send the data as JSON.",
  },
  429: {
    code: "RATE_LIMITED",
    message: "Too many requests. Please wait a moment and try again.",
  },
};

const DEFAULT_CLIENT_ERROR: ClientError = {
  code: "REQUEST_ERROR",
  message: "The request couldn't be processed.",
};

const INTERNAL_ERROR: ClientError = {
  code: "INTERNAL_ERROR",
  message: "Something went wrong on our side. Please try again.",
};

/** Returns the HTTP status carried by an error, or 500 if it has no valid one. */
function getStatusCode(error: unknown): number {
  if (typeof error === "object" && error !== null && "statusCode" in error) {
    const { statusCode } = error;
    if (
      typeof statusCode === "number" &&
      statusCode >= 400 &&
      statusCode <= 599
    ) {
      return statusCode;
    }
  }
  return 500;
}

/** Sends friendly, consistent JSON errors and never exposes internal details to clients. */
export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.code(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Some of the information sent isn't valid.",
          issues: error.validation.map((issue) => ({
            path: issue.instancePath,
            message: issue.message,
          })),
        },
      });
    }

    const statusCode = getStatusCode(error);
    if (statusCode === 401) {
      void reply.header("www-authenticate", "Bearer");
    }
    if (statusCode < 500) {
      return reply
        .code(statusCode)
        .send({ error: CLIENT_ERRORS[statusCode] ?? DEFAULT_CLIENT_ERROR });
    }

    request.log.error({ err: error }, "Unhandled error");
    return reply.code(500).send({ error: INTERNAL_ERROR });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send({ error: CLIENT_ERRORS[404] });
  });
}
