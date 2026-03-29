import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Суперадмин
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

  // 2. Демо-лига
  const existingLeague = await prisma.league.findUnique({
    where: { slug: "demo" },
  });

  if (existingLeague) {
    console.log("Demo league already exists, skipping.");
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
      name: "2025-2026",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-05-31"),
      isCurrent: true,
      leagueId: league.id,
    },
  });

  const tournament = await prisma.tournament.create({
    data: {
      name: "Регулярный чемпионат",
      type: "REGULAR",
      leagueId: league.id,
      seasonId: season.id,
    },
  });

  // 3. Команды
  const teamNames = ["Арктика", "Буран", "Вихрь", "Гром"];
  const teams = [];
  for (const name of teamNames) {
    const team = await prisma.team.create({
      data: {
        name,
        city: "Москва",
        leagueId: league.id,
      },
    });
    teams.push(team);
  }

  // 4. Игроки (10+ игроков, распределены по командам с вратарями)
  const firstNames = [
    "Алексей", "Дмитрий", "Сергей", "Иван", "Михаил",
    "Андрей", "Николай", "Павел", "Владимир", "Артём",
    "Егор", "Максим",
  ];
  const lastNames = [
    "Иванов", "Петров", "Сидоров", "Козлов", "Морозов",
    "Волков", "Соколов", "Попов", "Лебедев", "Кузнецов",
    "Новиков", "Зайцев",
  ];
  const rosterConfigs = [
    { positions: ["ВР", "ЗЩ", "ЦН"], roles: ["GOALIE", "SKATER", "SKATER"] as const },
    { positions: ["ВР", "ЗЩ", "ЛН"], roles: ["GOALIE", "SKATER", "SKATER"] as const },
    { positions: ["ВР", "ЦН", "ПН"], roles: ["GOALIE", "SKATER", "SKATER"] as const },
    { positions: ["ВР", "ЗЩ", "ЦН"], roles: ["GOALIE", "SKATER", "SKATER"] as const },
  ];

  let playerIdx = 0;
  for (let t = 0; t < teams.length; t++) {
    const team = teams[t];
    const config = rosterConfigs[t];
    for (let i = 0; i < config.positions.length; i++) {
      const player = await prisma.player.create({
        data: {
          firstName: firstNames[playerIdx],
          lastName: lastNames[playerIdx],
          role: config.roles[i],
          birthDate: new Date(1990 + playerIdx, playerIdx % 12, 1 + playerIdx),
          leagueId: league.id,
        },
      });
      await prisma.teamRoster.create({
        data: {
          teamId: team.id,
          playerId: player.id,
          seasonId: season.id,
          number: (i + 1) * 10 + playerIdx,
          position: config.positions[i],
          isCaptain: i === 1,
        },
      });
      playerIdx++;
    }
  }

  // 5. Матчи (5 матчей)
  const matchPairs = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
  ];

  for (let i = 0; i < matchPairs.length; i++) {
    const [home, away] = matchPairs[i];
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 5);

    await prisma.match.create({
      data: {
        datetime: new Date(2025, 9, 15 + i * 3, 19, 0),
        status: "FINISHED",
        homeTeamId: teams[home].id,
        awayTeamId: teams[away].id,
        homeScore,
        awayScore,
        tournamentId: tournament.id,
        leagueId: league.id,
      },
    });
  }

  // Пересчёт таблицы
  const { recalculateStandings } = await import("../src/lib/standings");
  await recalculateStandings(tournament.id);

  // 6. Тренеры
  for (let i = 0; i < teams.length; i++) {
    await prisma.coach.create({
      data: {
        firstName: ["Виктор", "Олег", "Борис", "Геннадий"][i],
        lastName: ["Тихонов", "Знарок", "Михайлов", "Цыгуров"][i],
        teamId: teams[i].id,
        leagueId: league.id,
      },
    });
  }

  // 7. Судьи
  const refereeNames = [
    { first: "Константин", last: "Оленин", category: "Первая" },
    { first: "Роман", last: "Гофман", category: "Национальная" },
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

  // 8. Новости
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
      title: "Стартовал регулярный чемпионат сезона 2025-2026",
      slug: "season-start",
      content:
        "<p>Регулярный чемпионат сезона 2025-2026 официально стартовал! В этом сезоне участвуют 4 команды.</p><p>Следите за расписанием матчей и результатами в разделах «Календарь» и «Результаты».</p>",
      publishedAt: new Date(Date.now() - 86400000),
      tags: ["сезон", "старт"],
      leagueId: league.id,
    },
  });

  console.log("Seed completed!");
  console.log(`Demo league: http://demo.localhost:3000`);
  console.log(`Demo admin: demo@sporthub.ru / Demo123!`);
  console.log(
    `Super admin: ${superadminEmail} / ${superadminPassword}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
