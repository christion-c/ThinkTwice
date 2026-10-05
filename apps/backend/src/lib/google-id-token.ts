import { GoogleAuth } from "google-auth-library";

// Fetches a short-lived Google-signed identity token scoped to the
// given audience, for calling another Cloud Run service that requires
// IAM authentication (see thinktwice-ml's ingress lockdown - it no
// longer accepts unauthenticated requests, only ones from a caller
// holding the run.invoker role, verified via this token). Backed by
// Application Default Credentials: in production that's the Cloud Run
// service's own runtime service account, resolved automatically via
// the metadata server - nothing to configure here.
//
// One GoogleAuth instance is reused across calls (not one per call) so
// its IdTokenClient caching/refresh logic actually gets to do its job
// instead of re-deriving credentials from scratch every request.
const auth = new GoogleAuth();
const idTokenClientsByAudience = new Map<
  string,
  ReturnType<GoogleAuth["getIdTokenClient"]>
>();

// Returns a ready-to-use "Bearer <token>" Authorization header value,
// or null (never throws) when a token can't be obtained - local
// development calls the ML service over a plain docker-compose
// hostname (http://ml:8000, see env.ts's ML_SERVICE_URL default) with
// no Cloud Run IAM in front of it and no real GCP credentials
// available in that environment, so this is expected there. The
// internal-service-token header check still gates the ML service
// independently of this, so a missing identity token there just means
// one fewer layer, not an open door.
export async function getIdTokenAuthHeader(
  audience: string,
): Promise<string | null> {
  try {
    let clientPromise = idTokenClientsByAudience.get(audience);

    if (!clientPromise) {
      clientPromise = auth.getIdTokenClient(audience);
      idTokenClientsByAudience.set(audience, clientPromise);
    }

    const client = await clientPromise;
    const headers = await client.getRequestHeaders();
    return headers.get("Authorization") ?? null;
  } catch {
    idTokenClientsByAudience.delete(audience);
    return null;
  }
}
