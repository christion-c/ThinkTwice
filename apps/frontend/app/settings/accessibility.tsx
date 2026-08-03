import SimpleCardPage from "../components/SimpleCardPage";

export default function Accessibility() {
  return (
    <SimpleCardPage
      title="Accessibility"
      subtitle="Adjust the app to match your comfort and readability needs."
      cardTitle="Accessibility Options"
      cardText="Tune contrast, text sizing, and interaction settings for a better daily experience."
      actions={[{ label: "Back to account settings", path: "/settings/account" }]}
    />
  );
}
