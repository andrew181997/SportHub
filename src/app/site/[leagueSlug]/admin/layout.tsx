import type { CSSProperties } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Users,
  UserCircle,
  Calendar,
  Newspaper,
  Image,
  Inbox,
  Settings,
  BarChart3,
  Scale,
  GraduationCap,
} from "lucide-react";

const navItems = [
  { href: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "statistics", label: "Статистика", icon: BarChart3 },
  { href: "tournaments", label: "Турниры", icon: Trophy },
  { href: "teams", label: "Команды", icon: Users },
  { href: "referees", label: "Судьи", icon: Scale },
  { href: "coaches", label: "Тренеры", icon: GraduationCap },
  { href: "players", label: "Игроки", icon: UserCircle },
  { href: "matches", label: "Матчи", icon: Calendar },
  { href: "news", label: "Новости", icon: Newspaper },
  { href: "media", label: "Медиа", icon: Image },
  { href: "applications", label: "Заявки", icon: Inbox },
  { href: "settings", label: "Настройки", icon: Settings },
];

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueSlug: string }>;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const session = await auth();
  const { leagueSlug } = await params;

  if (!session?.user) {
    redirect("/admin/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id! },
    select: { status: true, email: true },
  });

  if (!dbUser) {
    redirect("/admin/login");
  }

  if (dbUser.status === "PENDING") {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    redirect(
      `${base}/register/verify?email=${encodeURIComponent(dbUser.email)}`
    );
  }

  if (dbUser.status === "BLOCKED") {
    redirect("/admin/login?error=blocked");
  }

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    include: { siteConfig: true },
  });

  if (!league) redirect("/");

  if (league.status === "BLOCKED") {
    redirect("/admin/login?error=league_blocked");
  }

  const membership = await prisma.userLeague.findUnique({
    where: {
      userId_leagueId: {
        userId: session.user.id!,
        leagueId: league.id,
      },
    },
  });

  if (!membership) {
    redirect("/admin/login?error=no_access");
  }

  const themeId = league.siteConfig?.theme ?? "default";
  const primaryColor = league.siteConfig?.primaryColor ?? "#1d4ed8";
  const secondaryColor = league.siteConfig?.secondaryColor ?? "#9333ea";

  return (
    <div className="flex min-h-screen bg-slate-200/50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-5 border-b">
          <h2 className="font-bold text-gray-900 truncate">{league.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Админ-панель</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            if (
              membership.role === "EDITOR" &&
              !["dashboard", "statistics", "matches", "news", "media"].includes(
                item.href
              )
            ) {
              return null;
            }
            return (
              <Link
                key={item.href}
                href={`/admin/${item.href}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
          <p className="text-xs text-gray-400">{membership.role}</p>
        </div>
      </aside>
      <main
        className="flex-1 p-8"
        data-league-theme={themeId}
        style={
          {
            "--league-primary": primaryColor,
            "--league-secondary": secondaryColor,
          } as CSSProperties
        }
      >
        {children}
      </main>
    </div>
  );
}
