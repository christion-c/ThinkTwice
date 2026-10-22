/** A specific, friendly error the client is allowed to see, e.g. { code: "ACCOUNT_NOT_FOUND", message: "…" }. */
export interface PublicError {
  code: string;
  message: string;
}

interface HttpErrorOptions extends ErrorOptions {
  /** Sent to the client in place of the generic message for this status. Must never contain internal details. */
  publicError?: PublicError;
}

/** An error that should be sent to the client with a specific HTTP status (see plugins/error-handler.ts). */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly publicError: PublicError | undefined;

  /** Creates an error carrying the HTTP status to respond with; the message is for logs, never the client. */
  constructor(
    statusCode: number,
    message: string,
    options: HttpErrorOptions = {},
  ) {
    super(message, options);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.publicError = options.publicError;
  }
}
