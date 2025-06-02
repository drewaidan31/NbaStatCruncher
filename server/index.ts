// server/index.js

import express from "express";
import cors from "cors";
import axios from "axios";
import { create, all } from "mathjs";

const math = create(all, { number: "number" });
const app = express();
app.use(cors());
app.use(express.json());

// ── 1) Whitelist of allowed tokens ──
//    (These must match exactly the keys we’ll create below)
const SAFE_TOKENS = new Set(["PTS", "AST", "REB", "TOV", "PLUS_MINUS"]);

function compileFormula(rawFormula) {
  const normalized = rawFormula.toUpperCase().replace(/\s+/g, "");
  const tokens = normalized.match(/[A-Z_]+/g) || [];
  for (const t of tokens) {
    if (!SAFE_TOKENS.has(t)) {
      throw new Error(
        `Token "${t}" not allowed. Use only ${[...SAFE_TOKENS].join(", ")}`,
      );
    }
  }
  let expr = normalized;
  for (const t of tokens) {
    expr = expr.replace(new RegExp(t, "g"), `row["${t}"]`);
  }
  return (row) => {
    try {
      const val = math.evaluate(expr, { row });
      return typeof val === "number" && isFinite(val) ? val : NaN;
    } catch {
      return NaN;
    }
  };
}

// ── 2) In-memory cache (5 minutes) ──
let cachedPlayers = [];
let cacheTimestamp = 0;

async function fetchPerGameFromAPI_NBA() {
  const now = Date.now();
  if (cachedPlayers.length && now - cacheTimestamp < 5 * 60 * 1000) {
    return cachedPlayers;
  }

  // ── 3) RapidAPI credentials and endpoint ──
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const response = await axios.get(
    "https://api-nba-v1.p.rapidapi.com/statistics/players",
    {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "api-nba-v1.p.rapidapi.com",
      },
      params: {
        season: "2024", // ← This pulls the 2024–25 season per-game stats
        league: "standard", // “standard” = NBA (not G-League, etc.)
      },
    },
  );

  const rawData = response.data.response; // an array of player objects
  const rows = rawData.map((p) => {
    // Convert to per-game by dividing totals by gamesPlayed (gp)
    const gp = p.gamesPlayed || 1;
    return {
      PLAYER_NAME: `${p.player.firstName} ${p.player.lastName}`,
      TEAM_ABBREVIATION: p.team.abbreviation,
      PTS: (p.points || 0) / gp,
      AST: (p.assists || 0) / gp,
      REB: (p.totReb || 0) / gp,
      TOV: (p.tov || 0) / gp,
      PLUS_MINUS: (p.plusMinus || 0) / gp,
    };
  });

  cachedPlayers = rows;
  cacheTimestamp = now;
  return rows;
}

// ── 4) Leaderboard route ──
app.get("/api/leaderboard", async (req, res) => {
  const formula = req.query.formula;
  if (!formula || typeof formula !== "string") {
    return res
      .status(400)
      .json({ error: "Missing 'formula' query parameter." });
  }

  let calcFn;
  try {
    calcFn = compileFormula(formula);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  let players;
  try {
    players = await fetchPerGameFromAPI_NBA();
  } catch (e) {
    console.error("Fetch error:", e);
    return res.status(500).json({ error: "Failed to fetch NBA data." });
  }

  const scored = players.map((row) => ({
    name: row.PLAYER_NAME,
    team: row.TEAM_ABBREVIATION,
    score: calcFn(row),
  }));

  const top50 = scored
    .filter((p) => !isNaN(p.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  return res.json(top50);
});

app.get("/api/ping", (_req, res) => res.json({ pong: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
