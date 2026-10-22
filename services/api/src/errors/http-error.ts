/** An error that should be sent to the client with a specific HTTP status (see plugins/error-handler.ts). */
export class HttpError extends Error {
  readonly statusCode: number;

  /** Creates an error carrying the HTTP status to respond with; the message is for logs, never the client. */
  constructor(statusCode: number, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}
