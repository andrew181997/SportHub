import Link from "next/link";
import { formatDateLong } from "@/lib/utils";
import { Calendar, Trophy, ArrowRight, Users, ClipboardList } from "lucide-react";
import type { HomeSectionType } from "@/lib/home-sections";

type MatchCard = {
  id: string;
  datetime: Date;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string; logo: string | null };
  awayTeam: { name: string; logo: string | null };
  tournament?: { name: string } | null;
};

type NewsCard = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
};

type StandingRow = {
  id: string;
  points: number;
  gamesPlayed: number;
  team: { name: string };
};

type TeamCard = {
  id: string;
  name: string;
  city: string | null;
  logo: string | null;
};

type HomeData = {
  upcomingMatches: MatchCard[];
  recentResults: MatchCard[];
  latestNews: NewsCard[];
  standingsTournamentName: string | null;
  standingsRows: StandingRow[];
  teamsPreview: TeamCard[];
};

type Props = {
  league: {
    name: string;
    description: string | null;
  };
  primary: string;
  heroBackground: string;
  sectionOrder: HomeSectionType[];
  data: HomeData;
};

export function LeagueHomeBlocks({
  league,
  primary,
  heroBackground,
  sectionOrder,
  data,
}: Props) {
  const blocks = new Map<HomeSectionType, React.ReactNode>([
    [
      "hero",
      <section
        key="hero"
        className="league-hero text-white py-16 sm:py-28"
        style={{ background: heroBackground }}
      >
        <div className="relative z-[1] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-sm">
            {league.name}
          </h1>
          {league.description && (
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
              {league.description}
            </p>
          )}
        </div>
      </section>,
    ],
    [
      "upcoming_matches",
      <section key="upcoming" className="mb-10 last:mb-0">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="league-section-title">
            <Calendar className="w-5 h-5 shrink-0" style={{ color: primary }} />
            Ближайшие матчи
          </h2>
          <Link
            href="/calendar"
            className="league-link-arrow"
            style={{ color: primary }}
          >
            Все матчи <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.upcomingMatches.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="surface-match p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <span className="font-semibold league-text-foreground text-sm flex-1 text-right truncate">
                  {match.homeTeam.name}
                </span>
                <span className="league-vs-pill shrink-0">VS</span>
                <span className="font-semibold league-text-foreground text-sm flex-1 truncate">
                  {match.awayTeam.name}
                </span>
              </div>
              <span className="text-xs league-text-muted sm:ml-4 whitespace-nowrap shrink-0 sm:text-right">
                {formatDateLong(match.datetime)}
              </span>
            </Link>
          ))}
          {data.upcomingMatches.length === 0 && (
            <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
              Нет запланированных матчей
            </p>
          )}
        </div>
      </section>,
    ],
    [
      "results",
      <section key="results" className="mb-10 last:mb-0">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="league-section-title">
            <Trophy className="w-5 h-5 shrink-0" style={{ color: primary }} />
            Последние результаты
          </h2>
          <Link
            href="/results"
            className="league-link-arrow"
            style={{ color: primary }}
          >
            Все результаты <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-3">
          {data.recentResults.map((match) => (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="surface-match p-4 sm:p-5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <span className="font-semibold league-text-foreground text-sm flex-1 text-right truncate">
                  {match.homeTeam.name}
                </span>
                <span className="text-lg font-bold league-text-foreground px-2 sm:px-3 shrink-0 tabular-nums min-w-[4.5rem] text-center">
                  {match.homeScore} : {match.awayScore}
                </span>
                <span className="font-semibold league-text-foreground text-sm flex-1 truncate">
                  {match.awayTeam.name}
                </span>
              </div>
            </Link>
          ))}
          {data.recentResults.length === 0 && (
            <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
              Нет завершённых матчей
            </p>
          )}
        </div>
      </section>,
    ],
    [
      "news",
      <section key="news" className="mb-10 last:mb-0">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="league-section-title">Новости</h2>
          <Link
            href="/news"
            className="league-link-arrow"
            style={{ color: primary }}
          >
            Все новости <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.latestNews.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="block surface-entity-card p-4 sm:p-5 group"
            >
              <h3 className="font-semibold league-text-foreground text-sm line-clamp-2 group-hover:text-[color:var(--league-primary)] transition-colors">
                {article.title}
              </h3>
              {article.publishedAt && (
                <p className="text-xs league-text-muted mt-2.5">
                  {formatDateLong(article.publishedAt)}
                </p>
              )}
            </Link>
          ))}
        </div>
        {data.latestNews.length === 0 && (
          <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
            Нет новостей
          </p>
        )}
      </section>,
    ],
    [
      "standings",
      <section key="standings" className="mb-10 last:mb-0">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="league-section-title">Турнирная таблица</h2>
          {data.standingsTournamentName ? (
            <span className="text-xs text-slate-500 truncate max-w-[50%] text-right">
              {data.standingsTournamentName}
            </span>
          ) : null}
        </div>
        {data.standingsRows.length > 0 ? (
          <>
            <div className="surface-table-wrap overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-slate-600 w-10">#</th>
                    <th className="text-left px-4 py-2 font-medium text-slate-600">Команда</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-600">И</th>
                    <th className="text-center px-3 py-2 font-medium text-slate-800 font-bold">О</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.standingsRows.map((row, i) => (
                    <tr key={row.id} className="surface-player-row">
                      <td className="px-4 py-2 text-slate-600">{i + 1}</td>
                      <td className="px-4 py-2 font-medium text-slate-900">{row.team.name}</td>
                      <td className="text-center px-3 py-2 text-slate-600">{row.gamesPlayed}</td>
                      <td className="text-center px-3 py-2 font-bold text-slate-900">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link
                href="/standings"
                className="league-link-arrow inline-flex"
                style={{ color: primary }}
              >
                Все таблицы <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
            Пока нет данных таблицы
          </p>
        )}
      </section>,
    ],
    [
      "teams",
      <section key="teams" className="mb-10 last:mb-0">
        <div className="flex items-center justify-between mb-5 gap-3">
          <h2 className="league-section-title">
            <Users className="w-5 h-5 shrink-0" style={{ color: primary }} />
            Команды
          </h2>
          <Link
            href="/teams"
            className="league-link-arrow"
            style={{ color: primary }}
          >
            Все команды <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.teamsPreview.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="surface-entity-card p-4 flex items-center gap-3 hover:border-slate-400/80 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-500 shrink-0">
                {team.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.logo}
                    alt=""
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  team.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{team.name}</p>
                {team.city ? (
                  <p className="text-xs text-slate-500 truncate">{team.city}</p>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
        {data.teamsPreview.length === 0 && (
          <p className="text-sm league-text-muted py-6 text-center league-empty-panel">
            Нет команд
          </p>
        )}
      </section>,
    ],
    [
      "apply_cta",
      <section
        key="apply"
        className="mb-0 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 sm:p-10 text-center shadow-sm"
      >
        <ClipboardList
          className="w-10 h-10 mx-auto mb-4 opacity-90"
          style={{ color: primary }}
        />
        <h2 className="text-xl font-bold text-slate-900">Участие в лиге</h2>
        <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
          Подайте заявку на участие команды в турнирах и сезонах лиги.
        </p>
        <Link
          href="/apply"
          className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          style={{ backgroundColor: primary }}
        >
          Подать заявку
        </Link>
      </section>,
    ],
  ]);

  const mainStack = sectionOrder.filter((t) => t !== "hero");

  if (sectionOrder.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-slate-600">
          На главной пока нет блоков. Включите их в разделе{" "}
          <span className="font-medium text-slate-800">Админка → Настройки сайта → Блоки главной страницы</span>.
        </p>
      </div>
    );
  }

  return (
    <div>
      {sectionOrder.includes("hero") && blocks.get("hero")}
      {mainStack.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          {mainStack.map((type) => blocks.get(type))}
        </div>
      )}
    </div>
  );
}
