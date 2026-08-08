import SimpleCardPage from "../components/SimpleCardPage";

export default function ForgotPassword() {
  return (
    <SimpleCardPage
      title="Forgot Password"
      subtitle="Recover account access quickly and safely."
      cardTitle="Reset Access"
      cardText="Use your registered email to request a password reset link and get back in."
      actions={[{ label: "Back to login", path: "/auth/login" }]}
    />
  );
}
