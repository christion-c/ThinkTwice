import { router } from "expo-router";
import { Pressable, Text } from "react-native";

import PageScaffold from "@/components/layout/PageScaffold";
import LegalSection from "@/components/legal/LegalSection";
import { Card } from "@/components/ui";

const CONTACT_EMAIL = "bubba7xallahan@gmail.com";
const LAST_UPDATED = "August 24, 2026";

// Publicly reachable without signing in (see the isPublicLegalPage
// exemption in app/_layout.tsx) - Play/App Store reviewers and
// prospective users need to read this before, or without, creating an
// account. Content describes what this app actually does today: no ad
// SDK, no analytics/tracking SDK, no third-party data sale - update
// this if that ever changes.
export default function PrivacyPolicy() {
  return (
    <PageScaffold title="Privacy Policy" subtitle={`Last updated ${LAST_UPDATED}`}>
      <Card surface gap="md">
        <LegalSection title="What this app is">
          ThinkTwice is a personal budgeting and fuel-cost planning app. It helps you track income,
          expenses, and vehicle fuel costs, and forecasts your upcoming spending based on the
          numbers you enter.
        </LegalSection>

        <LegalSection title="Information we collect">
          Account information: when you sign in, we collect your email address, display name, and
          profile photo (if you sign in with Google) through Firebase Authentication.{"\n\n"}
          Budget and vehicle data you enter: income, expenses, fixed costs, vehicle details, fuel
          prices, mileage, and fill-up history. This is data you type into the app yourself - we
          don’t infer or purchase it from anywhere else.{"\n\n"}
          We do not collect your location, contacts, photos (beyond an optional Google profile
          picture), or any device data beyond what’s needed to run the app.
        </LegalSection>

        <LegalSection title="How we use this information">
          Your account identifies which budget and vehicle data belongs to you. The numbers you
          enter are used only to calculate the forecasts and summaries the app shows you - your
          projected monthly balance, fuel cost estimates, and similar figures. We don’t use your
          data for advertising, and we don’t build a profile of you for any purpose beyond running
          the app’s own features.
        </LegalSection>

        <LegalSection title="Who we share it with">
          We don’t sell your data or share it with advertisers. Your data is processed by the
          service providers that run the app: Firebase (Google) for authentication, and a
          Google Cloud-hosted database and forecasting service that we operate ourselves. No
          third party receives your budget or vehicle data for their own purposes.
        </LegalSection>

        <LegalSection title="Advertising and analytics">
          This app has no advertising SDK and no analytics or tracking SDK. Nothing about your use
          of the app is sold or shared for advertising purposes, because no such sharing exists in
          the first place.
        </LegalSection>

        <LegalSection title="Data retention and deletion">
          Your account and budget data are kept until you ask us to delete them.
        </LegalSection>

        <Pressable onPress={() => router.push("/delete-account")}>
          <Text className="text-sm font-bold text-accent">Request account deletion →</Text>
        </Pressable>

        <LegalSection title="Children’s privacy">
          ThinkTwice is not directed at children under 13, and we don’t knowingly collect
          information from them.
        </LegalSection>

        <LegalSection title="Changes to this policy">
          If this policy changes in a way that affects how your data is handled, we’ll update the
          date at the top of this page.
        </LegalSection>

        <LegalSection title="Contact us">
          {`Questions about this policy or your data? Email ${CONTACT_EMAIL}.`}
        </LegalSection>
      </Card>
    </PageScaffold>
  );
}
