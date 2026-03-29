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
} from "lucide-react";

const navItems = [
  { href: "dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "tournaments", label: "Турниры", icon: Trophy },
  { href: "teams", label: "Команды", icon: Users },
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

  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
  });

  if (!league) redirect("/");

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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-5 border-b">
          <h2 className="font-bold text-gray-900 truncate">{league.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Админ-панель</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            if (
              membership.role === "EDITOR" &&
              !["dashboard", "matches", "news", "media"].includes(item.href)
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
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
