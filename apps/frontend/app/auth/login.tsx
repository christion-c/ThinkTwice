import SimpleCardPage from "../components/SimpleCardPage";

export default function Login() {
  return (
    <SimpleCardPage
      title="Login"
      subtitle="Welcome back. Sign in to continue where you left off."
      cardTitle="Sign In"
      cardText="Connect your account to sync profile details, nutrition logs, and fuel entries."
      actions={[
        { label: "Create account", path: "/auth/register" },
        { label: "Forgot password", path: "/auth/forgotPassword" },
      ]}
    />
  );
}
