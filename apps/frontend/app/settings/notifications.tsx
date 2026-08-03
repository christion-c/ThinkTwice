import SimpleCardPage from "../components/SimpleCardPage";

export default function Notifications() {
  return (
    <SimpleCardPage
      title="Notifications"
      subtitle="Choose what updates you want to receive."
      cardTitle="Notification Preferences"
      cardText="Control reminders for meals, fuel check-ins, and account activity."
      actions={[{ label: "Back to account settings", path: "/settings/account" }]}
    />
  );
}
