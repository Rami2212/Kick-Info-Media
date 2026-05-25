/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const { randomUUID } = require("crypto");

function loadLocalEnv() {
  const envFile = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envFile)) return;

  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildDescription(country, group) {
  const safeCountry = escapeHtml(country);
  const safeGroup = escapeHtml(group);
  return [
    `<p><strong>${safeCountry}</strong> are in <strong>${safeGroup}</strong> for FIFA World Cup 2026.</p>`,
    "<p><strong>Squad Overview</strong></p>",
    "<ul>",
    "<li><strong>Goalkeepers:</strong> Competing options with focus on positioning, command, and build-up distribution.</li>",
    "<li><strong>Defenders:</strong> Mix of physical center-backs and energetic full-backs for both defensive cover and overlaps.</li>",
    "<li><strong>Midfielders:</strong> Balance between ball winners and progressive passers to control transitions.</li>",
    "<li><strong>Forwards:</strong> Wide pace plus central finishing threat, with rotation depth from the bench.</li>",
    "<li><strong>Set Pieces:</strong> Dead-ball structure is a key source of goals and momentum in tight matches.</li>",
    "</ul>",
    "<p><strong>Editorial Notes:</strong> Replace this snapshot with confirmed call-ups, captain, injury list, and likely XI after final squads are announced.</p>",
  ].join("");
}

function flagUrl(code) {
  return `https://flagcdn.com/w320/${code}.jpg`;
}

const teamsByGroup = [
  {
    group: "Group A",
    teams: [
      { country: "Mexico", code: "mx" },
      { country: "South Africa", code: "za" },
      { country: "Korea Republic", code: "kr" },
      { country: "Czechia", code: "cz" },
    ],
  },
  {
    group: "Group B",
    teams: [
      { country: "Canada", code: "ca" },
      { country: "Bosnia and Herzegovina", code: "ba" },
      { country: "Qatar", code: "qa" },
      { country: "Switzerland", code: "ch" },
    ],
  },
  {
    group: "Group C",
    teams: [
      { country: "Brazil", code: "br" },
      { country: "Morocco", code: "ma" },
      { country: "Haiti", code: "ht" },
      { country: "Scotland", code: "gb-sct" },
    ],
  },
  {
    group: "Group D",
    teams: [
      { country: "USA", code: "us" },
      { country: "Paraguay", code: "py" },
      { country: "Australia", code: "au" },
      { country: "Turkiye", code: "tr" },
    ],
  },
  {
    group: "Group E",
    teams: [
      { country: "Germany", code: "de" },
      { country: "Curacao", code: "cw" },
      { country: "Cote d'Ivoire", code: "ci" },
      { country: "Ecuador", code: "ec" },
    ],
  },
  {
    group: "Group F",
    teams: [
      { country: "Netherlands", code: "nl" },
      { country: "Japan", code: "jp" },
      { country: "Sweden", code: "se" },
      { country: "Tunisia", code: "tn" },
    ],
  },
  {
    group: "Group G",
    teams: [
      { country: "Belgium", code: "be" },
      { country: "Egypt", code: "eg" },
      { country: "IR Iran", code: "ir" },
      { country: "New Zealand", code: "nz" },
    ],
  },
  {
    group: "Group H",
    teams: [
      { country: "Spain", code: "es" },
      { country: "Cabo Verde", code: "cv" },
      { country: "Saudi Arabia", code: "sa" },
      { country: "Uruguay", code: "uy" },
    ],
  },
  {
    group: "Group I",
    teams: [
      { country: "France", code: "fr" },
      { country: "Senegal", code: "sn" },
      { country: "Iraq", code: "iq" },
      { country: "Norway", code: "no" },
    ],
  },
  {
    group: "Group J",
    teams: [
      { country: "Argentina", code: "ar" },
      { country: "Algeria", code: "dz" },
      { country: "Austria", code: "at" },
      { country: "Jordan", code: "jo" },
    ],
  },
  {
    group: "Group K",
    teams: [
      { country: "Portugal", code: "pt" },
      { country: "Congo DR", code: "cd" },
      { country: "Uzbekistan", code: "uz" },
      { country: "Colombia", code: "co" },
    ],
  },
  {
    group: "Group L",
    teams: [
      { country: "England", code: "gb-eng" },
      { country: "Croatia", code: "hr" },
      { country: "Ghana", code: "gh" },
      { country: "Panama", code: "pa" },
    ],
  },
];

const fifaTeams = teamsByGroup.flatMap((entry) =>
  entry.teams.map((team) => ({
    group: entry.group,
    country: team.country,
    cover_image_url: flagUrl(team.code),
    team_image_url: flagUrl(team.code),
    description: buildDescription(team.country, entry.group),
  })),
);

async function seed() {
  loadLocalEnv();

  const uri = process.env.MONGODB_URI || "";
  const dbName = process.env.MONGODB_DB_NAME || "lankachat";

  if (!uri) {
    throw new Error("MONGODB_URI is missing. Set it in environment or .env.local");
  }

  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(dbName);
    const collection = db.collection("teams");
    const now = new Date().toISOString();

    let inserted = 0;
    let updated = 0;

    for (const team of fifaTeams) {
      const existing = await collection.findOne({ country: team.country });
      const updateDoc = {
        group: team.group,
        country: team.country,
        description: team.description,
        cover_image_url: team.cover_image_url,
        team_image_url: team.team_image_url,
        published: true,
        updated_at: now,
      };

      if (existing) {
        await collection.updateOne({ _id: existing._id }, { $set: updateDoc });
        updated += 1;
      } else {
        await collection.insertOne({
          id: randomUUID(),
          ...updateDoc,
          created_at: now,
        });
        inserted += 1;
      }
    }

    const total = await collection.countDocuments();
    console.log(`FIFA 2026 teams seed complete.`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Total teams in collection: ${total}`);
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});

