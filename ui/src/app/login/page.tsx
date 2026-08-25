import {
  LoginBrandPanel,
  LoginForm,
} from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="flex w-full max-w-4xl items-center justify-center gap-8">
        <LoginBrandPanel />
        <LoginForm />
      </div>
    </main>
  );
}
