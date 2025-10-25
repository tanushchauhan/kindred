import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Sign in",
  description: "Sign in to your account",
};

export default function SignInPage() {
  return (
    <main style={{ padding: 24 }}>
      <AuthForm mode="signin" />
    </main>
  );
}
