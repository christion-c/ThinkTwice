import SimpleCardPage from "../components/SimpleCardPage";

export default function Account() {
  return (
    <SimpleCardPage
      title="Account"
      subtitle="Manage your personal details and account preferences."
      cardTitle="Account Settings"
      cardText="Update your name, email, and login preferences from this section."
      actions={[{ label: "Go to profile", path: "/profile/profile" }]}
    />
  );
}
