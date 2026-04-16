import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { prisma } from "@/lib/prisma";

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ leagueSlug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ leagueSlug }, { error }] = await Promise.all([
    params,
    searchParams,
  ]);

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    select: { name: true, status: true },
  });

  if (league?.status === "BLOCKED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-amber-950">
            Доступ к админ-панели ограничен
          </h1>
          <p className="mt-3 text-sm text-amber-900">
            Лига «{league.name}» временно отключена. Обратитесь в поддержку
            SportHub.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthSessionProvider>
      <AdminLoginForm accessError={error} />
    </AuthSessionProvider>
  );
}
