import {
  PrismaClient,
  type MatchEventType,
  type Player,
  type PlayerRole,
} from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

const CURRENT_YEAR = new Date().getFullYear();

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)]!;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Круговой этап: n команд, n−1 туров, n/2 пар за тур → n(n−1)/2 матчей, у каждой команды n−1 игр. */
function roundRobinPairIndices(n: number): [number, number][] {
  if (n % 2 !== 0) throw new Error("Чётное число команд");
  const nums = Array.from({ length: n }, (_, i) => i);
  const rounds = n - 1;
  const games: [number, number][] = [];
  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < n / 2; i++) {
      games.push([nums[i]!, nums[n - 1 - i]!]);
    }
    const last = nums.pop()!;
    nums.splice(1, 0, last);
  }
  return games;
}

/**
 * 12 будущих матчей на 8 команд: у каждой ровно 3 игры (3 регулярных «тура» по 4 пары).
 */
function buildFutureMatchPairs(teamIds: string[]): [string, string][] {
  if (teamIds.length !== 8) throw new Error("Ожидается 8 команд");
  const idxPairs: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 3],
    [1, 2],
    [4, 7],
    [5, 6],
  ];
  shuffle(idxPairs);
  return idxPairs.map(([i, j]) => [teamIds[i]!, teamIds[j]!]);
}

const ADJECTIVES = [
  "Дикие",
  "Быстрые",
  "Серые",
  "Смелые",
  "Ночные",
  "Северные",
  "Огненные",
  "Ледяные",
  "Свободные",
  "Горные",
  "Речные",
  "Степные",
  "Белые",
  "Чёрные",
  "Золотые",
  "Серебряные",
  "Молодые",
  "Старые",
  "Тихие",
  "Грозные",
  "Вольные",
  "Полярные",
  "Красные",
  "Синие",
];

const ANIMALS = [
  "вороны",
  "волки",
  "медведи",
  "орлы",
  "тигры",
  "рыси",
  "барсы",
  "лисы",
  "зубры",
  "лоси",
  "соколы",
  "ястребы",
  "акулы",
  "скаты",
  "киты",
  "пантеры",
  "леопарды",
  "бизоны",
  "олени",
  "кабаны",
  "норки",
  "выдры",
  "суслики",
];

const FIRST_NAMES = [
  "Алексей",
  "Дмитрий",
  "Сергей",
  "Иван",
  "Михаил",
  "Андрей",
  "Николай",
  "Павел",
  "Владимир",
  "Артём",
  "Егор",
  "Максим",
  "Кирилл",
  "Олег",
  "Роман",
  "Илья",
  "Григорий",
  "Станислав",
  "Виктор",
  "Борис",
  "Константин",
  "Тимофей",
  "Матвей",
  "Денис",
  "Антон",
  "Евгений",
  "Даниил",
  "Фёдор",
  "Глеб",
  "Ярослав",
];

const PATRONYMICS = [
  "Алексеевич",
  "Дмитриевич",
  "Сергеевич",
  "Иванович",
  "Михайлович",
  "Андреевич",
  "Николаевич",
  "Павлович",
  "Владимирович",
  "Артёмович",
  "Егорович",
  "Максимович",
  "Олегович",
  "Романович",
  "Ильич",
  "Григорьевич",
  "Станиславович",
  "Викторович",
  "Борисович",
  "Константинович",
];

const LAST_NAMES = [
  "Иванов",
  "Петров",
  "Сидоров",
  "Козлов",
  "Морозов",
  "Волков",
  "Соколов",
  "Попов",
  "Лебедев",
  "Кузнецов",
  "Новиков",
  "Зайцев",
  "Смирнов",
  "Крылов",
  "Орлов",
  "Сокол",
  "Медведев",
  "Зверев",
  "Белов",
  "Чернов",
  "Рыбаков",
  "Осипов",
  "Гусев",
  "Лисицын",
  "Воронов",
  "Барсов",
  "Тигров",
  "Рысьев",
  "Оленев",
];

function uniqueTeamNames(count: number): string[] {
  const names = new Set<string>();
  let guard = 0;
  while (names.size < count && guard < count * 100) {
    guard++;
    const adj = pick(ADJECTIVES);
    const animal = pick(ANIMALS);
    names.add(`${adj} ${animal}`);
  }
  if (names.size < count) {
    let i = 0;
    while (names.size < count) {
      i++;
      names.add(`${pick(ADJECTIVES)} ${pick(ANIMALS)} ${i}`);
    }
  }
  return shuffle([...names]).slice(0, count);
}

function randomRussianFio(): {
  firstName: string;
  lastName: string;
  middleName: string;
} {
  return {
    firstName: pick(FIRST_NAMES),
    lastName: pick(LAST_NAMES),
    middleName: pick(PATRONYMICS),
  };
}

type RosterByRole = {
  teamId: string;
  goalies: Player[];
  forwards: Player[];
  defenders: Player[];
  skaters: Player[];
};

async function createTeamWithRoster(
  leagueId: string,
  seasonId: string,
  teamName: string,
  city: string
): Promise<RosterByRole> {
  const team = await prisma.team.create({
    data: { name: teamName, city, leagueId },
  });

  const roles: { role: PlayerRole; position: string }[] = [
    ...Array.from({ length: 2 }, () => ({ role: "GOALIE" as const, position: "ВР" })),
    ...Array.from({ length: 12 }, () => ({
      role: "FORWARD" as const,
      position: "ПН",
    })),
    ...Array.from({ length: 6 }, () => ({
      role: "DEFENDER" as const,
      position: "ЗЩ",
    })),
  ];

  shuffle(roles);

  const goalies: Player[] = [];
  const forwards: Player[] = [];
  const defenders: Player[] = [];
  const skaters: Player[] = [];

  for (let i = 0; i < roles.length; i++) {
    const { role, position } = roles[i]!;
    const fio = randomRussianFio();
    const player = await prisma.player.create({
      data: {
        ...fio,
        role,
        birthDate: new Date(
          randInt(1995, 2006),
          randInt(0, 11),
          randInt(1, 28)
        ),
        leagueId,
      },
    });
    await prisma.teamRoster.create({
      data: {
        teamId: team.id,
        playerId: player.id,
        seasonId,
        number: i + 1,
        position,
        isCaptain: i === 2,
      },
    });
    if (role === "GOALIE") goalies.push(player);
    else if (role === "FORWARD") forwards.push(player);
    else defenders.push(player);
    if (role !== "GOALIE") skaters.push(player);
  }

  return {
    teamId: team.id,
    goalies,
    forwards,
    defenders,
    skaters,
  };
}

function pickScorer(roster: RosterByRole): Player {
  const r = Math.random();
  if (r < 0.78) return pick(roster.forwards);
  if (r < 0.94) return pick(roster.defenders);
  return pick(roster.skaters);
}

async function createProtocolForFinishedMatch(
  matchId: string,
  home: RosterByRole,
  away: RosterByRole,
  homeScore: number,
  awayScore: number,
  overtime: boolean,
  shootout: boolean
) {
  const events: {
    type: MatchEventType;
    playerId: string;
    teamId: string;
    period: number;
    time: string;
  }[] = [];

  for (let g = 0; g < homeScore; g++) {
    const scorer = pickScorer(home);
    const period = randInt(1, overtime ? 4 : 3);
    const time = `${String(randInt(0, 19)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}`;
    events.push({
      type: "GOAL",
      playerId: scorer.id,
      teamId: home.teamId,
      period,
      time,
    });
    if (Math.random() < 0.72) {
      const assister = pick(home.skaters.filter((p) => p.id !== scorer.id));
      if (assister) {
        events.push({
          type: "ASSIST",
          playerId: assister.id,
          teamId: home.teamId,
          period,
          time,
        });
      }
    }
  }

  for (let g = 0; g < awayScore; g++) {
    const scorer = pickScorer(away);
    const period = randInt(1, overtime ? 4 : 3);
    const time = `${String(randInt(0, 19)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}`;
    events.push({
      type: "GOAL",
      playerId: scorer.id,
      teamId: away.teamId,
      period,
      time,
    });
    if (Math.random() < 0.72) {
      const assister = pick(away.skaters.filter((p) => p.id !== scorer.id));
      if (assister) {
        events.push({
          type: "ASSIST",
          playerId: assister.id,
          teamId: away.teamId,
          period,
          time,
        });
      }
    }
  }

  shuffle(events);

  for (const e of events) {
    await prisma.matchEvent.create({
      data: {
        matchId,
        type: e.type,
        playerId: e.playerId,
        teamId: e.teamId,
        period: e.period,
        time: e.time,
      },
    });
  }

  const penaltyReasons = [
    "Задержка клюшкой",
    "Подножка",
    "Игра высокой клюшкой",
    "Толчок",
    "Сечение",
  ];
  const numPenalties = randInt(0, 4);
  for (let p = 0; p < numPenalties; p++) {
    const side = Math.random() < 0.5 ? home : away;
    const pool = side.skaters;
    if (pool.length === 0) continue;
    await prisma.penalty.create({
      data: {
        matchId,
        playerId: pick(pool).id,
        teamId: side.teamId,
        minutes: pick([2, 2, 2, 4, 5]),
        reason: pick(penaltyReasons),
        period: randInt(1, 3),
        time: `${String(randInt(0, 19)).padStart(2, "0")}:${String(randInt(0, 59)).padStart(2, "0")}`,
      },
    });
  }

  const homeGa = awayScore;
  const awayGa = homeScore;
  const hg = home.goalies[0]!;
  const ag = away.goalies[0]!;
  await prisma.goalieStats.create({
    data: {
      matchId,
      playerId: hg.id,
      teamId: home.teamId,
      saves: randInt(18, 42),
      goalsAgainst: homeGa,
      shutout: homeGa === 0 && Math.random() < 0.15,
    },
  });
  await prisma.goalieStats.create({
    data: {
      matchId,
      playerId: ag.id,
      teamId: away.teamId,
      saves: randInt(18, 42),
      goalsAgainst: awayGa,
      shutout: awayGa === 0 && Math.random() < 0.15,
    },
  });

  if (Math.random() < 0.25) {
    const saver = pick(home.goalies);
    await prisma.matchEvent.create({
      data: {
        matchId,
        type: "SAVE",
        playerId: saver.id,
        teamId: home.teamId,
        period: randInt(1, 3),
        time: `${String(randInt(0, 19)).padStart(2, "0")}:00`,
      },
    });
  }
  if (Math.random() < 0.25) {
    const saver = pick(away.goalies);
    await prisma.matchEvent.create({
      data: {
        matchId,
        type: "SAVE",
        playerId: saver.id,
        teamId: away.teamId,
        period: randInt(1, 3),
        time: `${String(randInt(0, 19)).padStart(2, "0")}:00`,
      },
    });
  }

  if (shootout || (overtime && Math.random() < 0.4)) {
    const shooter = pick(home.forwards);
    await prisma.matchEvent.create({
      data: {
        matchId,
        type: "PENALTY_SHOT",
        playerId: shooter.id,
        teamId: home.teamId,
        period: overtime ? 4 : 3,
        time: "05:00",
      },
    });
  }
}

async function main() {
  console.log("Seeding database...");

  const superadminEmail = process.env.SUPERADMIN_EMAIL ?? "admin@sporthub.ru";
  const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "Admin123!";

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { isSuperAdmin: true },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: superadminEmail,
        name: "Super Admin",
        passwordHash: await hash(superadminPassword, 12),
        isSuperAdmin: true,
        status: "ACTIVE",
      },
    });
    console.log(`Super admin created: ${superadminEmail}`);
  }

  const existingLeague = await prisma.league.findUnique({
    where: { slug: "demo" },
  });

  async function ensureDemoLeagueAdmin(leagueId: string) {
    const email = "demo@sporthub.ru";
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: "Демо Организатор",
          passwordHash: await hash("Demo123!", 12),
          status: "ACTIVE",
        },
      });
      console.log(`Demo user created: ${email} / Demo123!`);
    }
    const link = await prisma.userLeague.findUnique({
      where: { userId_leagueId: { userId: user.id, leagueId } },
    });
    if (!link) {
      await prisma.userLeague.create({
        data: { userId: user.id, leagueId, role: "ADMIN" },
      });
      console.log(`UserLeague: ${email} → лига demo (ADMIN)`);
    }
  }

  if (existingLeague) {
    await ensureDemoLeagueAdmin(existingLeague.id);
    console.log("Демо-лига уже есть — проверена привязка demo@sporthub.ru.");
    return;
  }

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@sporthub.ru",
      name: "Демо Организатор",
      passwordHash: await hash("Demo123!", 12),
      status: "ACTIVE",
    },
  });

  const league = await prisma.league.create({
    data: {
      name: "Демо Хоккейная Лига",
      slug: "demo",
      sportType: "HOCKEY",
      description:
        "Демонстрационная лига для тестирования платформы SportHub",
      siteConfig: { create: {} },
      plan: { create: {} },
    },
  });

  await prisma.userLeague.create({
    data: { userId: demoUser.id, leagueId: league.id, role: "ADMIN" },
  });

  const season = await prisma.season.create({
    data: {
      name: `${CURRENT_YEAR}-${CURRENT_YEAR + 1}`,
      startDate: new Date(CURRENT_YEAR, 8, 1),
      endDate: new Date(CURRENT_YEAR + 1, 4, 31),
      isCurrent: true,
      leagueId: league.id,
    },
  });

  const tournamentNames = ["Про", "Центр", "Старт"] as const;
  const { recalculateStandings } = await import("../src/lib/standings");

  const allTeamNames = uniqueTeamNames(24);
  let nameCursor = 0;

  for (const tName of tournamentNames) {
    const tournament = await prisma.tournament.create({
      data: {
        name: tName,
        type: "REGULAR",
        leagueId: league.id,
        seasonId: season.id,
      },
    });

    const rosters: RosterByRole[] = [];
    for (let i = 0; i < 8; i++) {
      const roster = await createTeamWithRoster(
        league.id,
        season.id,
        allTeamNames[nameCursor]!,
        "Москва"
      );
      nameCursor++;
      rosters.push(roster);
    }

    const pairIdx = roundRobinPairIndices(8);
    const finishedBase = new Date(CURRENT_YEAR, 0, 10);
    for (let m = 0; m < pairIdx.length; m++) {
      const [hi, ai] = pairIdx[m]!;
      const homeR = rosters[hi]!;
      const awayR = rosters[ai]!;
      let homeScore = randInt(0, 6);
      let awayScore = randInt(0, 6);
      if (homeScore === 0 && awayScore === 0 && Math.random() < 0.9) {
        homeScore = randInt(1, 5);
        awayScore = randInt(1, 5);
      }
      let overtime = false;
      let shootout = false;
      if (homeScore === awayScore) {
        if (Math.random() < 0.32) {
          overtime = true;
          if (Math.random() < 0.35) shootout = true;
          if (Math.random() < 0.5) homeScore += 1;
          else awayScore += 1;
        }
      } else if (Math.random() < 0.12) {
        overtime = true;
      }

      const day = Math.min(28, 5 + Math.floor((m / 4) * 8) + (m % 4));
      const month = Math.min(11, Math.floor(m / 4));
      const dt = new Date(
        CURRENT_YEAR,
        month,
        day,
        pick([17, 18, 19, 20]),
        pick([0, 30]),
        0
      );

      const match = await prisma.match.create({
        data: {
          datetime: dt,
          status: "FINISHED",
          homeTeamId: homeR.teamId,
          awayTeamId: awayR.teamId,
          homeScore,
          awayScore,
          overtime,
          shootout,
          venue: pick(["Арена Север", "ЛД «Юнион»", "Каток «Метеор»", "Дворец спорта"]),
          round: Math.floor(m / 4) + 1,
          tournamentId: tournament.id,
          leagueId: league.id,
        },
      });

      await createProtocolForFinishedMatch(
        match.id,
        homeR,
        awayR,
        homeScore,
        awayScore,
        overtime,
        shootout
      );
    }

    const futurePairs = buildFutureMatchPairs(rosters.map((r) => r.teamId));
    const futureStart = new Date(CURRENT_YEAR, 9, 1);
    for (let f = 0; f < futurePairs.length; f++) {
      const [homeId, awayId] = futurePairs[f]!;
      const d = new Date(futureStart);
      d.setDate(d.getDate() + f * 4 + randInt(0, 2));
      d.setHours(pick([18, 19]), pick([0, 30]), 0, 0);
      await prisma.match.create({
        data: {
          datetime: d,
          status: "SCHEDULED",
          homeTeamId: homeId,
          awayTeamId: awayId,
          homeScore: null,
          awayScore: null,
          tournamentId: tournament.id,
          leagueId: league.id,
          venue: pick(["Арена Север", "ЛД «Юнион»"]),
          round: 100 + f,
        },
      });
    }

    await recalculateStandings(tournament.id);
    console.log(`Турнир «${tName}»: 8 команд, 28 сыгранных + 12 запланированных матчей.`);
  }

  let coachFirst = 0;
  for (const tName of tournamentNames) {
    const tr = await prisma.tournament.findFirst({
      where: { leagueId: league.id, name: tName },
      include: { standings: { select: { teamId: true } } },
    });
    if (!tr) continue;
    const teamIds = [...new Set(tr.standings.map((s) => s.teamId))];
    for (const teamId of teamIds) {
      await prisma.coach.create({
        data: {
          firstName: FIRST_NAMES[coachFirst % FIRST_NAMES.length]!,
          lastName: LAST_NAMES[coachFirst % LAST_NAMES.length]!,
          teamId,
          leagueId: league.id,
        },
      });
      coachFirst++;
    }
  }

  const refereeNames = [
    { first: "Константин", last: "Оленин", category: "Первая" },
    { first: "Роман", last: "Гофман", category: "Национальная" },
    { first: "Артём", last: "Лебедев", category: "КХЛ" },
  ];
  for (const ref of refereeNames) {
    await prisma.referee.create({
      data: {
        firstName: ref.first,
        lastName: ref.last,
        category: ref.category,
        leagueId: league.id,
      },
    });
  }

  await prisma.news.create({
    data: {
      title: "Добро пожаловать в Демо Хоккейную Лигу!",
      slug: "welcome",
      content:
        "<p>Мы рады приветствовать всех на нашей платформе. Это демонстрационная лига для тестирования возможностей SportHub.</p>",
      publishedAt: new Date(),
      leagueId: league.id,
    },
  });

  await prisma.news.create({
    data: {
      title: `Сезон ${CURRENT_YEAR}: турниры Про, Центр и Старт`,
      slug: "season-start",
      content: `<p>В демо-лиге три параллельных турнира — <strong>Про</strong>, <strong>Центр</strong> и <strong>Старт</strong>. В каждом восемь команд, сыгран полный круг (${CURRENT_YEAR} год), впереди запланированные матчи.</p>`,
      publishedAt: new Date(Date.now() - 86400000),
      tags: ["сезон", "турниры"],
      leagueId: league.id,
    },
  });

  console.log("Seed completed!");
  console.log(`Demo league: http://demo.localhost:3000`);
  console.log(`Demo admin: demo@sporthub.ru / Demo123!`);
  console.log(`Super admin: ${superadminEmail} / ${superadminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
