import { prisma } from "./prisma";

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsv).join(",");
}

export async function exportTeamsCsv(leagueId: string): Promise<string> {
  const teams = await prisma.team.findMany({
    where: { leagueId, archivedAt: null },
    orderBy: { name: "asc" },
  });

  const header = toCsvRow(["ID", "Название", "Город", "Год основания", "Email", "Создано"]);
  const rows = teams.map((t) =>
    toCsvRow([t.id, t.name, t.city, t.foundedYear, t.contactEmail, t.createdAt.toISOString()])
  );

  return [header, ...rows].join("\n");
}

export async function exportPlayersCsv(leagueId: string): Promise<string> {
  const players = await prisma.player.findMany({
    where: { leagueId, archivedAt: null },
    include: {
      rosters: {
        include: { team: { select: { name: true } } },
        take: 1,
        orderBy: { season: { startDate: "desc" } },
      },
    },
    orderBy: { lastName: "asc" },
  });

  const header = toCsvRow([
    "ID", "Фамилия", "Имя", "Отчество", "Дата рождения", "Амплуа", "Команда",
  ]);
  const rows = players.map((p) =>
    toCsvRow([
      p.id,
      p.lastName,
      p.firstName,
      p.middleName,
      p.birthDate?.toISOString().slice(0, 10),
      p.role,
      p.rosters[0]?.team.name,
    ])
  );

  return [header, ...rows].join("\n");
}

export async function exportMatchesCsv(leagueId: string): Promise<string> {
  const matches = await prisma.match.findMany({
    where: { leagueId, archivedAt: null },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      tournament: { select: { name: true } },
    },
    orderBy: { datetime: "desc" },
  });

  const header = toCsvRow([
    "ID", "Дата", "Турнир", "Хозяева", "Гости", "Счёт хозяев", "Счёт гостей", "Статус", "Площадка",
  ]);
  const rows = matches.map((m) =>
    toCsvRow([
      m.id,
      m.datetime.toISOString(),
      m.tournament.name,
      m.homeTeam.name,
      m.awayTeam.name,
      m.homeScore,
      m.awayScore,
      m.status,
      m.venue,
    ])
  );

  return [header, ...rows].join("\n");
}

export async function exportStandingsCsv(leagueId: string): Promise<string> {
  const standings = await prisma.standing.findMany({
    where: { tournament: { leagueId } },
    include: {
      team: { select: { name: true } },
      tournament: { select: { name: true } },
    },
    orderBy: { points: "desc" },
  });

  const header = toCsvRow([
    "Турнир", "Команда", "Игры", "Победы", "Поражения", "Ничьи",
    "ПО", "ПП", "Забито", "Пропущено", "Очки",
  ]);
  const rows = standings.map((s) =>
    toCsvRow([
      s.tournament.name, s.team.name, s.gamesPlayed, s.wins, s.losses,
      s.draws, s.overtimeWins, s.overtimeLosses, s.goalsFor, s.goalsAgainst, s.points,
    ])
  );

  return [header, ...rows].join("\n");
}
