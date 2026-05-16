import { Router } from "express";

const router = Router();

// Football-Data.org API credentials
const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || "84578e2521374c3d9f13a400f7ef0caf";

// API Key for authentication (for your frontend)
const VALID_API_KEYS = [
  "84578e2521374c3d9f13a400f7ef0caf",
  process.env.LIVE_SCORES_API_KEY || "84578e2521374c3d9f13a400f7ef0caf"
];

// Middleware to validate API key
function validateApiKey(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ ok: false, error: "Missing API key" });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!VALID_API_KEYS.includes(token)) {
    return res.status(403).json({ ok: false, error: "Invalid API key" });
  }

  next();
}

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

function matchesQuery(match, query) {
  if (!query) return true;
  const q = normalize(query);
  if (!q) return true;

  const haystack = [
    match.matchId,
    match.league,
    match.stage,
    match.homeTeam,
    match.awayTeam,
    `${match.homeScore}-${match.awayScore}`,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

// Transform Football-Data.org response to our format
function transformMatch(match) {
  try {
    const { id, homeTeam, awayTeam, score, status, competition } = match;

    return {
      matchId: `${competition.id}-${id}`,
      league: competition.name,
      stage: status === "LIVE" ? "Live" : status === "FINISHED" ? "Final" : "Scheduled",
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeScore: score.fullTime.home !== null ? score.fullTime.home : 0,
      awayScore: score.fullTime.away !== null ? score.fullTime.away : 0,
    };
  } catch (err) {
    console.error("Error transforming match:", err);
    return null;
  }
}

/**
 * Fetch from Football-Data.org
 */
async function fetchFromFootballData({ limit }) {
  try {
    if (!FOOTBALL_DATA_API_KEY) {
      console.error("Football-Data.org API key not provided");
      return [];
    }

    const options = {
      method: "GET",
      headers: {
        "X-Auth-Token": FOOTBALL_DATA_API_KEY,
      },
    };

    const now = new Date();

    // Only include matches from yesterday, today, and tomorrow.
    // Note: Football-Data expects dates in YYYY-MM-DD (UTC-ish via toISOString()).
    const from = new Date(now);
    from.setDate(from.getDate() - 1);

    const to = new Date(now);
    to.setDate(to.getDate() + 1);

    const fromISO = from.toISOString().slice(0, 10);
    const toISO = to.toISOString().slice(0, 10);

    const url = `https://api.football-data.org/v4/matches?status=LIVE,FINISHED,SCHEDULED&dateFrom=${encodeURIComponent(
      fromISO
    )}&dateTo=${encodeURIComponent(toISO)}&limit=${encodeURIComponent(String(limit))}`;

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Football-Data.org API error:", response.status, errorText);
      return [];
    }

    const data = await response.json();
    return (data.matches || [])
      .map(transformMatch)
      .filter((m) => m !== null);
  } catch (err) {
    console.error("Error fetching from Football-Data.org:", err);
    return [];
  }
}

router.get("/live-scores", validateApiKey, async (req, res) => {
  try {
    const q = req.query.q;
    const league = req.query.league;
    const matchId = req.query.matchId;

    // Fetch real data from Football-Data.org
    const limitRaw = req.query.limit;
    const limitNum = Number(limitRaw);
    const limit =
      Number.isFinite(limitNum) && limitNum > 0 ? Math.min(Math.floor(limitNum), 100) : 50;

    let data = await fetchFromFootballData({ limit });

    // Filter by league
    if (league) {
      const leagueNorm = normalize(league);
      data = data.filter((m) => normalize(m.league) === leagueNorm);
    }

    // Filter by matchId
    if (matchId) {
      const matchIdNorm = normalize(matchId);
      data = data.filter((m) => normalize(m.matchId) === matchIdNorm);
    }

    // Filter by search query
    if (q) {
      data = data.filter((m) => matchesQuery(m, q));
    }

    res.json({
      ok: true,
      query: {
        q: req.query.q ?? null,
        matchId: req.query.matchId ?? null,
        league: req.query.league ?? null,
      },
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("Error in /live-scores:", err);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch live scores",
    });
  }
});

export default router;
