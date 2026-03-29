import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AuthSessionProvider } from "@/components/auth/session-provider";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <AuthSessionProvider>
      <AdminLoginForm accessError={error} />
    </AuthSessionProvider>
  );
}
