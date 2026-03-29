import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Search } from "lucide-react";
import { SearchDialog } from "@/components/public/search-dialog";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leagueSlug: string }>;
}) {
  const { leagueSlug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug: leagueSlug },
    include: { siteConfig: true },
  });

  if (!league) notFound();

  const navLinks = [
    { href: "/tournaments", label: "Турниры" },
    { href: "/calendar", label: "Календарь" },
    { href: "/standings", label: "Таблица" },
    { href: "/teams", label: "Команды" },
    { href: "/players", label: "Игроки" },
    { href: "/coaches", label: "Тренеры" },
    { href: "/referees", label: "Судьи" },
    { href: "/news", label: "Новости" },
    { href: "/media", label: "Медиа" },
    { href: "/about", label: "О лиге" },
  ];

  const primaryColor = league.siteConfig?.primaryColor ?? "#1d4ed8";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold" style={{ color: primaryColor }}>
              {league.name}
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <SearchDialog />
      <main className="flex-1">{children}</main>

      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-500">
          <p>{league.siteConfig?.footerText ?? `© ${new Date().getFullYear()} ${league.name}`}</p>
          <p className="mt-2">
            Работает на{" "}
            <a href="https://sporthub.ru" className="text-blue-600 hover:underline">
              SportHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
