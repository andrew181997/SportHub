import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Users,
  Eye,
  Bell,
  CreditCard,
  ScrollText,
} from "lucide-react";

const navItems = [
  { href: "/superadmin/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/superadmin/leagues", label: "Лиги", icon: Shield },
  { href: "/superadmin/users", label: "Пользователи", icon: Users },
  { href: "/superadmin/moderation", label: "Модерация", icon: Eye },
  { href: "/superadmin/notifications", label: "Уведомления", icon: Bell },
  { href: "/superadmin/plans", label: "Тарифы", icon: CreditCard },
  { href: "/superadmin/audit-log", label: "Журнал действий", icon: ScrollText },
];

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  if (pathname === "/superadmin/login") {
    return <>{children}</>;
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/superadmin/login");
  }

  if (!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin) {
    const { notFound } = await import("next/navigation");
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <Link href="/superadmin/dashboard" className="text-xl font-bold">
            SportHub
          </Link>
          <p className="text-xs text-gray-400 mt-1">Панель управления</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-400 truncate">
            {session.user.email}
          </p>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
