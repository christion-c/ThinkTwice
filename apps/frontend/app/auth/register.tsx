import SimpleCardPage from "../components/SimpleCardPage";

export default function Register() {
  return (
    <SimpleCardPage
      title="Register"
      subtitle="Create your account and personalize your experience."
      cardTitle="Get Started"
      cardText="Set up a secure account to track habits, nutrition, and profile settings in one place."
      actions={[
        { label: "Already have an account? Login", path: "/auth/login" },
        { label: "Need help? Reset password", path: "/auth/forgotPassword" },
      ]}
    />
  );
}
