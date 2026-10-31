import { AuthForm } from "@/app/_components/auth-form";

export const metadata = { title: "Log in — SmartTrip" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
