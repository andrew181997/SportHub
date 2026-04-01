import type { CSSProperties } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SearchDialog } from "@/components/public/search-dialog";
import { PublicHeaderSearchTrigger } from "@/components/public/public-header-search-trigger";
import { getLeaguePublicShell } from "@/lib/league-theme";

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
    { href: "/statistics", label: "Статистика" },
    { href: "/teams", label: "Команды" },
    { href: "/players", label: "Игроки" },
    { href: "/coaches", label: "Тренеры" },
    { href: "/referees", label: "Судьи" },
    { href: "/news", label: "Новости" },
    { href: "/media", label: "Медиа" },
    { href: "/about", label: "О лиге" },
  ];

  const primaryColor = league.siteConfig?.primaryColor ?? "#1d4ed8";
  const secondaryColor = league.siteConfig?.secondaryColor ?? "#9333ea";
  const shell = getLeaguePublicShell(league.siteConfig?.theme);

  const headerStyle = shell.useGradientHeader
    ? {
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      }
    : undefined;

  const defaultFooter = `© ${new Date().getFullYear()} ${league.name}`;
  const footerCopy = league.siteConfig?.footerText?.trim() || defaultFooter;

  const themeId = league.siteConfig?.theme ?? "default";

  return (
    <div
      className={shell.root}
      data-league-theme={themeId}
      style={
        {
          "--league-primary": primaryColor,
          "--league-secondary": secondaryColor,
        } as CSSProperties
      }
    >
      <header className={shell.header} style={headerStyle}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link
              href="/"
              className={`text-xl font-bold ${shell.useGradientHeader ? "text-white drop-shadow-sm" : ""}`}
              style={!shell.useGradientHeader ? { color: primaryColor } : undefined}
            >
              {league.name}
            </Link>
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={shell.navLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <PublicHeaderSearchTrigger variant={shell.searchVariant} />
          </div>
        </div>
      </header>

      <SearchDialog />
      <main className={shell.main}>{children}</main>

      <footer className={shell.footer}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <p>{footerCopy}</p>
          <p className="mt-2">
            Работает на{" "}
            <a
              href="https://sporthub.ru"
              className="hover:underline font-medium"
              style={{ color: primaryColor }}
            >
              SportHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
