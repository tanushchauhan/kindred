import AuthForm from "../components/AuthForm";

export const metadata = {
  title: "Sign up",
  description: "Create a new account",
};

export default function SignUpPage() {
  return (
    <main style={{ padding: 24 }}>
      <AuthForm mode="signup" />
    </main>
  );
}
