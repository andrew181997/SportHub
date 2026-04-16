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

  if (league.status === "BLOCKED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900">
            Лига временно недоступна
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Сайт лиги «{league.name}» временно отключён. За подробностями
            обратитесь в поддержку SportHub.
          </p>
        </div>
      </div>
    );
  }

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
          <div className="h-16 lg:h-[4.25rem] flex items-center justify-between gap-4">
            <Link
              href="/"
              className={`text-xl sm:text-2xl font-bold tracking-tight transition-all duration-200 hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-md ${
                shell.useGradientHeader
                  ? "text-white drop-shadow-sm hover:underline decoration-2 underline-offset-4 decoration-white/80 focus-visible:ring-white/55 ring-offset-0"
                  : "hover:underline decoration-2 underline-offset-4 decoration-[color:var(--league-primary)] focus-visible:ring-slate-400/80"
              }`}
              style={!shell.useGradientHeader ? { color: primaryColor } : undefined}
            >
              {league.name}
            </Link>
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center max-w-4xl mx-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={shell.navLink}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="shrink-0 flex items-center">
              <PublicHeaderSearchTrigger variant={shell.searchVariant} />
            </div>
          </div>
        </div>
      </header>

      <SearchDialog />
      <main className={shell.main}>{children}</main>

      <footer className={`${shell.footer} league-public-footer`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 text-center text-sm">
          <p className="league-footer-tagline font-medium text-slate-700">
            {footerCopy}
          </p>
          <p className="league-footer-powered mt-3 text-xs text-slate-500">
            Работает на{" "}
            <a
              href="https://sporthub.ru"
              className="font-semibold hover:underline underline-offset-2 decoration-slate-300 hover:decoration-[color:var(--league-primary)] transition-colors"
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
