package expo.modules.googlesignin

import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/** The user closed Google's account picker without choosing an account. */
class SignInCancelledException :
  CodedException("ERR_GOOGLE_SIGN_IN_CANCELLED", "Google sign-in was cancelled.", null)

/** The device has no Google account to sign in with. */
class NoGoogleAccountException :
  CodedException("ERR_GOOGLE_NO_ACCOUNT", "No Google account is available on this device.", null)

/** Google sign-in failed for another reason (details are only in the cause, never shown to users). */
class SignInFailedException(cause: Throwable?) :
  CodedException("ERR_GOOGLE_SIGN_IN_FAILED", "Google sign-in failed.", cause)

/** Signs in with Google through Credential Manager and returns the account's Google ID token. */
class GoogleSignInModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("GoogleSignIn")

    // Shows Google's "Sign in with Google" sheet and returns the chosen account's Google ID token.
    AsyncFunction("signInAsync") Coroutine { webClientId: String ->
      val activity = appContext.currentActivity ?: throw SignInFailedException(null)
      val option = GetSignInWithGoogleOption.Builder(serverClientId = webClientId).build()
      val request = GetCredentialRequest.Builder().addCredentialOption(option).build()

      val credential = try {
        CredentialManager.create(activity).getCredential(activity, request).credential
      } catch (error: GetCredentialCancellationException) {
        throw SignInCancelledException()
      } catch (error: NoCredentialException) {
        throw NoGoogleAccountException()
      } catch (error: GetCredentialException) {
        throw SignInFailedException(error)
      }

      if (credential !is CustomCredential ||
        credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
      ) {
        throw SignInFailedException(null)
      }
      try {
        GoogleIdTokenCredential.createFrom(credential.data).idToken
      } catch (error: GoogleIdTokenParsingException) {
        throw SignInFailedException(error)
      }
    }

    // Forgets the account chosen last time, so signing in again shows Google's account picker.
    AsyncFunction("signOutAsync") Coroutine { ->
      val context = appContext.reactContext ?: return@Coroutine
      CredentialManager.create(context).clearCredentialState(ClearCredentialStateRequest())
    }
  }
}
