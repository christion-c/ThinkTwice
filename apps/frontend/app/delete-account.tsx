import { Linking, Pressable, Text } from "react-native";

import PageScaffold from "@/components/PageScaffold";
import LegalSection from "@/components/legal/LegalSection";
import { Card } from "@/components/ui";

const CONTACT_EMAIL = "bubba7xallahan@gmail.com";
const DELETE_REQUEST_SUBJECT = "Delete my ThinkTwice account";
const DELETE_REQUEST_BODY =
  "Please delete my ThinkTwice account and all associated data.\n\nAccount email:\n";
const MAILTO_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(DELETE_REQUEST_SUBJECT)}&body=${encodeURIComponent(DELETE_REQUEST_BODY)}`;

// Publicly reachable without signing in (see the isPublicLegalPage
// exemption in app/_layout.tsx) - Google Play requires a deletion
// request path that works even for someone who no longer has (or
// never installed) the app, not just an in-app menu item, so this
// email flow stays even though signed-in users now have a faster
// self-service option (Settings > Account > Delete my account).
export default function DeleteAccount() {
  return (
    <PageScaffold title="Delete Account" subtitle="Request removal of your account and all associated data.">
      <Card surface gap="md">
        <LegalSection title="What gets deleted">
          Your account (email, display name, and profile photo if you signed in with Google), every
          vehicle you’ve added, and all budget, expense, and fill-up history tied to your account.
          This can’t be undone.
        </LegalSection>

        <LegalSection title="How to request it">
          If you can still sign in, deleting from Settings &gt; Account &gt; Delete my account is
          instant. Otherwise, email us from the address on your account with the button below, or
          send it manually to {CONTACT_EMAIL}. Include your account email so we can find the right
          account. We’ll confirm by email once the deletion is complete.
        </LegalSection>

        <Pressable
          onPress={() => void Linking.openURL(MAILTO_HREF)}
          className="items-center rounded-md bg-danger py-3.5"
        >
          <Text className="font-bold text-background">Email us to request deletion</Text>
        </Pressable>
      </Card>
    </PageScaffold>
  );
}
