import fs from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabase";

export const MATCH_WRAPPED_PARTY_SLUG = "meetcut-x-tsa-x-ksa-x-tcl";

export interface UnlockSchedule {
  majorMinorAt: string;
  hometownAt: string;
  hobbiesAt: string;
  fullAt: string;
}

export interface GateState {
  majorMinorUnlocked: boolean;
  hometownUnlocked: boolean;
  hobbiesUnlocked: boolean;
  fullUnlocked: boolean;
  nextUnlockAt: string | null;
}

interface WrappedCard {
  id: string;
  type:
    | "orbitalGravityIntro"
    | "cipherCascade"
    | "blueprintDraftReveal"
    | "topographicMorph"
    | "constellationBuild"
    | "spectrumSplit"
    | "reactorSim"
    | "neonFlashTransition"
    | "panelCurtainReveal";
  gate?: { unlockAt: string; key: "majorMinor" | "hometown" | "hobbies" | "full" };
  data: {
    locked?: Record<string, unknown>;
    unlocked: Record<string, unknown>;
  };
}

export interface WrappedScript {
  meta: {
    partyId: string;
    viewerName: string;
    now: string;
    schedule: UnlockSchedule;
    gateState: GateState;
  };
  theme: {
    palette: string;
    stickers: string[];
    typeScale: string;
  };
  cards: WrappedCard[];
}

type ParticipantRow = {
  andrewId: string;
  name: string;
  age: string;
  gender: string;
  preferences: string;
  majorMinor: string;
  hometown: string;
  hobbies: string;
  organizations: string;
  mbti: string;
  idealFriday: string;
  greenFlagLike: string;
  biggestGreenFlag: string;
  idealDate: string;
  idealTypeArchetype: string;
  match: string;
};

type MatchRow = Record<string, unknown>;

const DEFAULT_VIEWER_NAME = "You";

const SCHEDULE: UnlockSchedule = {
  majorMinorAt: "2026-02-11T21:00:00-05:00",
  hometownAt: "2026-02-11T21:30:00-05:00",
  hobbiesAt: "2026-02-11T22:00:00-05:00",
  fullAt: "2026-02-11T23:00:00-05:00",
};

const VIEWER_ANDREW_KEYS = ["harvested_andrewIDs", "harvested_andrewids", "harvested_andrew_id", "andrew_id", "andrewID", "andrewid"];
const MATCHED_ANDREW_KEYS = ["matched_andrewID", "matched_andrewid", "matched_andrew_id", "match_andrew_id"];
const NAME_KEYS = ["name", "Name"];

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeAndrewID(value: string): string {
  return value.trim().toLowerCase().replace(/@andrew\.cmu\.edu$/, "");
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getValue(row: MatchRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim().length > 0) {
      return String(value).trim();
    }
  }
  return "";
}

function getAndrewIdCandidates(row: MatchRow): string[] {
  const candidates: string[] = [];
  const idField = getValue(row, VIEWER_ANDREW_KEYS);
  if (idField) {
    idField
      .split(/[\s,;]+/)
      .map(normalizeAndrewID)
      .filter(Boolean)
      .forEach((id) => candidates.push(id));
  }

  const email = getValue(row, ["email", "Email Address"]);
  if (email.includes("@")) {
    const emailPrefix = normalizeAndrewID(email.split("@")[0] || "");
    if (emailPrefix) candidates.push(emailPrefix);
  }

  return Array.from(new Set(candidates));
}

function findRowByAndrewId(rows: MatchRow[], andrewId: string): MatchRow | undefined {
  const normalized = normalizeAndrewID(andrewId);
  if (!normalized) return undefined;
  return rows.find((row) => getAndrewIdCandidates(row).includes(normalized));
}

function toParticipantFromMatchRow(row: MatchRow): ParticipantRow {
  return {
    andrewId: getAndrewIdCandidates(row)[0] || normalizeAndrewID(getValue(row, ["andrew_id", "andrewID"])),
    name: getValue(row, NAME_KEYS),
    age: getValue(row, ["age", "Age"]),
    gender: getValue(row, ["gender", "Gender"]),
    preferences: getValue(row, ["preferred_gender", "preferences", "Preferences"]),
    majorMinor: getValue(row, ["major", "major_minor", "Major/Minor"]),
    hometown: getValue(row, ["hometown", "Hometown"]),
    hobbies: getValue(row, ["hobbies", "Hobbies!!"]),
    organizations: getValue(row, ["organizations", "Organizations on campus", "organizations_on_campus"]),
    mbti: getValue(row, ["mbti", "MBTI "]),
    idealFriday: getValue(row, ["ideal_friday", "What's your ideal Friday night?"]),
    greenFlagLike: getValue(row, ["ideal_flags", "green_flag_like", "What’s a green flag that immediately makes you like someone?"]),
    biggestGreenFlag: getValue(row, ["personal_qualities", "biggest_green_flag", "What do you think is your biggest green flag / favorite thing about yourself?"]),
    idealDate: getValue(row, ["ideal_date", "What's your ideal date? "]),
    idealTypeArchetype: getValue(row, ["ideal_type", "ideal_type_archetype", `Describe your ideal type in a 1 sentence archetype\n"theatre kid with mustache who is silly and goofy and will make me laugh"`]),
    match: getValue(row, MATCHED_ANDREW_KEYS) || getValue(row, ["match", "Match"]),
  };
}

function parseCsv(csvContent: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentValue);
      currentValue = "";
      if (currentRow.some((value) => value.trim().length > 0)) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((value) => value.trim().length > 0)) rows.push(currentRow);
  }

  return rows;
}

function toParticipantRows(csvRows: string[][]): ParticipantRow[] {
  const [header, ...dataRows] = csvRows;
  if (!header || header.length === 0) return [];

  const index = (name: string) => header.findIndex((h) => h.trim() === name);
  const get = (row: string[], fieldIndex: number) => (fieldIndex >= 0 ? (row[fieldIndex] ?? "").trim() : "");

  const idx = {
    name: index("Name"),
    age: index("Age"),
    gender: index("Gender"),
    preferences: index("Preferences"),
    majorMinor: index("Major/Minor"),
    hometown: index("Hometown"),
    hobbies: index("Hobbies!!"),
    organizations: index("Organizations on campus"),
    mbti: index("MBTI "),
    idealFriday: index("What's your ideal Friday night?"),
    greenFlagLike: index("What’s a green flag that immediately makes you like someone?"),
    biggestGreenFlag: index("What do you think is your biggest green flag / favorite thing about yourself?"),
    idealDate: index("What's your ideal date? "),
    idealTypeArchetype: index(`Describe your ideal type in a 1 sentence archetype
"theatre kid with mustache who is silly and goofy and will make me laugh"`),
    match: index("Match"),
  };

  return dataRows
    .map((row) => ({
      andrewId: normalizeAndrewID(asString(get(row, index("Email Address")).split("@")[0])),
      name: get(row, idx.name),
      age: get(row, idx.age),
      gender: get(row, idx.gender),
      preferences: get(row, idx.preferences),
      majorMinor: get(row, idx.majorMinor),
      hometown: get(row, idx.hometown),
      hobbies: get(row, idx.hobbies),
      organizations: get(row, idx.organizations),
      mbti: get(row, idx.mbti),
      idealFriday: get(row, idx.idealFriday),
      greenFlagLike: get(row, idx.greenFlagLike),
      biggestGreenFlag: get(row, idx.biggestGreenFlag),
      idealDate: get(row, idx.idealDate),
      idealTypeArchetype: get(row, idx.idealTypeArchetype),
      match: get(row, idx.match),
    }))
    .filter((row) => row.name.length > 0);
}

function toEtTimeLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

export function computeGateState(now: Date, schedule: UnlockSchedule): GateState {
  const majorMinorUnlocked = now >= new Date(schedule.majorMinorAt);
  const hometownUnlocked = now >= new Date(schedule.hometownAt);
  const hobbiesUnlocked = now >= new Date(schedule.hobbiesAt);
  const fullUnlocked = now >= new Date(schedule.fullAt);

  const futureUnlocks = [
    schedule.majorMinorAt,
    schedule.hometownAt,
    schedule.hobbiesAt,
    schedule.fullAt,
  ].filter((unlockAt) => now < new Date(unlockAt));

  return {
    majorMinorUnlocked,
    hometownUnlocked,
    hobbiesUnlocked,
    fullUnlocked,
    nextUnlockAt: futureUnlocks.length > 0 ? futureUnlocks.sort()[0] : null,
  };
}

export function getUnlockSchedule(): UnlockSchedule {
  return SCHEDULE;
}

async function loadParticipantsFromCsvFallback(): Promise<ParticipantRow[]> {
  const filePath = path.join(process.cwd(), "mockData.csv");
  const fileContent = await fs.readFile(filePath, "utf8");
  const parsedRows = parseCsv(fileContent);
  return toParticipantRows(parsedRows);
}

function toMatchRows(csvRows: string[][]): MatchRow[] {
  const [header, ...dataRows] = csvRows;
  if (!header || header.length === 0) return [];

  return dataRows
    .filter((row) => row.some((value) => value.trim().length > 0))
    .map((row) => {
      const result: MatchRow = {};
      header.forEach((field, index) => {
        result[field.trim()] = row[index] ?? "";
      });
      return result;
    });
}

async function loadMatchRows(): Promise<MatchRow[]> {
  const { data, error } = await supabase.from("test_matches").select("*");
  if (error) {
    throw error;
  }
  return (data as MatchRow[]) || [];
}

function fallbackParticipant(name: string): ParticipantRow {
  return {
    andrewId: "",
    name,
    age: "N/A",
    gender: "N/A",
    preferences: "N/A",
    majorMinor: "Undisclosed",
    hometown: "Undisclosed",
    hobbies: "Undisclosed",
    organizations: "Undisclosed",
    mbti: "N/A",
    idealFriday: "N/A",
    greenFlagLike: "N/A",
    biggestGreenFlag: "N/A",
    idealDate: "N/A",
    idealTypeArchetype: "N/A",
    match: "",
  };
}

function findByName(rows: MatchRow[], name: string): MatchRow | undefined {
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  return rows.find((row) => normalizeName(getValue(row, NAME_KEYS)) === normalized);
}

export async function hasWrappedMatch(viewerAndrewID?: string): Promise<boolean> {
  const normalizedViewerAndrewID = normalizeAndrewID(viewerAndrewID || "");
  if (!normalizedViewerAndrewID) return false;
  try {
    const { data, error } = await supabase
      .from("test_matches")
      .select("harvested_andrewIDs")
      .eq("harvested_andrewIDs", normalizedViewerAndrewID)
      .limit(1);

    if (error) {
      throw error;
    }

    return Boolean(data && data.length > 0);
  } catch (error) {
    console.error("Failed checking wrapped availability from test_matches", error);
    return false;
  }
}

export async function buildWrappedScript(partyId: string, viewerAndrewID?: string, nowInput?: Date): Promise<WrappedScript> {
  const normalizedViewerAndrewID = normalizeAndrewID(viewerAndrewID || "");

  let viewer = fallbackParticipant(DEFAULT_VIEWER_NAME);
  let match = fallbackParticipant("Your match");

  try {
    const rows = await loadMatchRows();
    const viewerRow = findRowByAndrewId(rows, normalizedViewerAndrewID);

    if (viewerRow) {
      viewer = toParticipantFromMatchRow(viewerRow);

      const matchedAndrewId = normalizeAndrewID(getValue(viewerRow, MATCHED_ANDREW_KEYS));
      const matchedByAndrewRow = matchedAndrewId ? findRowByAndrewId(rows, matchedAndrewId) : undefined;
      const matchedByNameRow = !matchedByAndrewRow ? findByName(rows, getValue(viewerRow, ["match", "Match"])) : undefined;
      const matchRow = matchedByAndrewRow || matchedByNameRow;

      if (matchRow) {
        match = toParticipantFromMatchRow(matchRow);
      } else if (matchedAndrewId) {
        match = fallbackParticipant(matchedAndrewId);
      }
    }
  } catch (error) {
    console.error("Failed loading wrapped matches from Supabase table test_matches", error);
    throw error;
  }

  const now = nowInput ?? new Date();
  const schedule = getUnlockSchedule();
  const gateState = computeGateState(now, schedule);
  const overlapScore = (() => {
    const viewerHobbies = new Set(
      (viewer.hobbies || "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    );
    const matchHobbies = (match.hobbies || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const shared = matchHobbies.filter((item) => viewerHobbies.has(item)).length;
    return Math.min(98, 40 + shared * 14);
  })();

  const cards: WrappedCard[] = [
    {
      id: "vibe-snapshot",
      type: "orbitalGravityIntro",
      data: {
        unlocked: {
          title: "Your vibe snapshot",
          subtitle: "This is your energy profile right now.",
          mbti: viewer.mbti || "N/A",
          idealFriday: viewer.idealFriday || "N/A",
          hobbies: viewer.hobbies || "N/A",
        },
      },
    },
    {
      id: "match-loading",
      type: "cipherCascade",
      data: {
        unlocked: {
          title: "Your match is loading...",
          subtitle: "You are matched with someone special. Your reveals unlock live.",
        },
      },
    },
    {
      id: "major-minor",
      type: "blueprintDraftReveal",
      gate: { unlockAt: schedule.majorMinorAt, key: "majorMinor" },
      data: {
        locked: {
          label: "Major/Minor",
          value: `Unlocks at ${toEtTimeLabel(schedule.majorMinorAt)} ET`,
          countdownTo: schedule.majorMinorAt,
        },
        unlocked: {
          label: "Major/Minor",
          value: match.majorMinor || "Undisclosed",
        },
      },
    },
    {
      id: "hometown",
      type: "topographicMorph",
      gate: { unlockAt: schedule.hometownAt, key: "hometown" },
      data: {
        locked: {
          label: "Hometown",
          value: `Unlocks at ${toEtTimeLabel(schedule.hometownAt)} ET`,
          countdownTo: schedule.hometownAt,
        },
        unlocked: {
          label: "Hometown",
          value: match.hometown || "Undisclosed",
        },
      },
    },
    {
      id: "hobbies",
      type: "constellationBuild",
      gate: { unlockAt: schedule.hobbiesAt, key: "hobbies" },
      data: {
        locked: {
          label: "Hobbies",
          value: `Unlocks at ${toEtTimeLabel(schedule.hobbiesAt)} ET`,
          countdownTo: schedule.hobbiesAt,
        },
        unlocked: {
          label: "Hobbies",
          value: match.hobbies || "Undisclosed",
          tags: (match.hobbies || "")
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        },
      },
    },
    {
      id: "compat-spectrum",
      type: "spectrumSplit",
      data: {
        unlocked: {
          title: "Your compatibility spectrum",
          subtitle: "This is your non-identifying overlap signal.",
          compatibilityScore: overlapScore,
          axes: ["Lifestyle", "Interests", "Energy"],
        },
      },
    },
    {
      id: "green-reactor",
      type: "reactorSim",
      gate: { unlockAt: schedule.fullAt, key: "full" },
      data: {
        locked: {
          label: "MBTI Personality Reactor",
          value: `Unlocks at ${toEtTimeLabel(schedule.fullAt)} ET`,
          countdownTo: schedule.fullAt,
        },
        unlocked: {
          title: "Your MBTI personality reactor",
          mbtiPersonality: match.mbti || "N/A",
        },
      },
    },
    {
      id: "pre-reveal-transition",
      type: "neonFlashTransition",
      data: {
        unlocked: {
          title: "Your final reveal is next",
          subtitle: "Take a breath. Swipe up when you're ready.",
        },
      },
    },
    {
      id: "full-reveal",
      type: "panelCurtainReveal",
      gate: { unlockAt: schedule.fullAt, key: "full" },
      data: {
        locked: {
          label: "Full Reveal",
          value: `Full reveal at ${toEtTimeLabel(schedule.fullAt)} ET`,
          countdownTo: schedule.fullAt,
        },
        unlocked: {
          title: "This is your match",
          name: match.name || "Your match",
          profile: [
            { label: "Age", value: match.age || "N/A" },
            { label: "Gender", value: match.gender || "N/A" },
            { label: "Preferences", value: match.preferences || "N/A" },
            { label: "Major/Minor", value: match.majorMinor || "Undisclosed" },
            { label: "Hometown", value: match.hometown || "Undisclosed" },
            { label: "Hobbies", value: match.hobbies || "Undisclosed" },
            { label: "Organizations", value: match.organizations || "N/A" },
            { label: "MBTI Personality", value: match.mbti || "N/A" },
            { label: "Compatibility Score", value: `${overlapScore}%` },
            { label: "Ideal Date", value: match.idealDate || "N/A" },
            { label: "Ideal Type Archetype", value: match.idealTypeArchetype || "N/A" },
          ],
        },
      },
    },
  ];

  return {
    meta: {
      partyId,
      viewerName: viewer.name,
      now: now.toISOString(),
      schedule,
      gateState,
    },
    theme: {
      palette: "neon-noir",
      stickers: ["blobs", "sparkles", "pins"],
      typeScale: "wrapped-bold",
    },
    cards,
  };
}
