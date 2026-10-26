import Redis from "ioredis";
import readline from "node:readline/promises";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";
dotenv.config();

// ---------- config ----------
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4:31b";
// Ollama cloud: https://ollama.com + API key. Local Ollama: http://localhost:11434 (no key)
const OLLAMA_URL = process.env.OLLAMA_URL ?? "https://ollama.com";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
// "functionCalling" for gpt-oss; "jsonSchema" for llama3.1 / qwen2.5 on Ollama >= 0.5.0
const STRUCTURED_METHOD = process.env.STRUCTURED_METHOD ?? "functionCalling";
const REDIS_URL = process.env.REDIS_URL;
const SESSION_TTL_SEC = 30 * 60;
const MAX_HISTORY_MESSAGES = 20;

function validateConfig() {
  if (!REDIS_URL) {
    throw new Error("REDIS_URL is not set. Example: REDIS_URL=rediss://default:<password>@<host>:<port>");
  }
  if (OLLAMA_URL.includes("ollama.com") && !OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY is not set but OLLAMA_URL points to ollama.com (cloud needs a key).");
  }
}

// ---------- redis ----------
let redis;
let chain;

function initialize() {
  if (redis && chain) return;

  validateConfig();
  redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 3, connectTimeout: 10_000 });
  redis.on("error", (e) => {
    console.error("Redis error:", {
      code: e.code,
      message: e.message,
      inner: e.errors?.map((x) => `${x.code} ${x.address}:${x.port}`),
    });
  });
}

const key = (id) => `chat:${id}`;
const emptyStation = () => ({ status: "missing", name: null, options: [] });
const newState = () => ({
  messages: [], // [{ role: "human" | "ai", content }]
  slots: { from: emptyStation(), to: emptyStation(), date: null },
});

async function loadState(id) {
  const raw = await redis.get(key(id));
  return raw ? JSON.parse(raw) : newState();
}
async function saveState(id, state) {
  state.messages = state.messages.slice(-MAX_HISTORY_MESSAGES);
  await redis.set(key(id), JSON.stringify(state), "EX", SESSION_TTL_SEC);
}

// ---------- LLM ----------
const stationSchema = z.object({
  status: z
    .enum(["missing", "valid", "needs_clarification"])
    .describe("valid = specific, real station. needs_clarification = vague/ambiguous/unsure it exists. missing = not provided."),
  name: z
    .string()
    .nullable()
    .describe("ONLY the station code, e.g. 'NDLS' — never the station name or 'Name (CODE)'. Only when status is valid, else null."),
  options: z
    .array(z.string())
    .describe("When needs_clarification: 2-5 specific station options, e.g. 'New Delhi (NDLS)'. Otherwise empty."),
});

const turnSchema = z.object({
  from: stationSchema,
  to: stationSchema,
  date: z.string().nullable().describe("Journey date as DD/MM/YYYY, or null if not given."),
  reply: z.string().describe("Short friendly message to the user."),
});

const SYSTEM = `You are a train ticket assistant. Collect exactly three things: FROM station, TO station, and journey DATE.
Today's date is {today}.

Currently known values (JSON): {slots}
Keep known values unchanged unless the user changes them.

Station rules (Indian Railways):
- valid: the user gave a specific station that really exists (name or code), e.g. "New Delhi", "NDLS", "Mumbai CSMT". Set name to "CODE".
- needs_clarification: the user gave a city or vague name that has several stations (e.g. "Delhi", "Mumbai", "Kolkata"), OR you are not sure the station exists. Put 2-5 real stations in options. If it does not look like a real place, leave options empty and ask the user to recheck.
- missing: the user has not given it yet.
- Never invent stations.
- If the user is answering your earlier clarification question ("the first one", "nizamuddin", "NDLS"), resolve it using the conversation history.

Date rules:
- Convert to DD/MM/YYYY ("tomorrow", "25 dec", "next friday"). If the year is missing, use the next upcoming occurrence. null if not given.

Reply rules:
- One short, friendly message. Ask only for what is still missing or unclear, one thing at a time.
- When clarifying a station, list the options.
- If all three are complete, reply with "Thanks!".`;

const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const llm = new ChatOllama({
  model: MODEL,
  baseUrl: OLLAMA_URL,
  temperature: 0,
  headers: OLLAMA_API_KEY
  ? { Authorization: `Bearer ${OLLAMA_API_KEY.trim()}` }
  : undefined,
});
chain = prompt.pipe(llm.withStructuredOutput(turnSchema, { method: STRUCTURED_METHOD }));

// Retry once if the model returns something that isn't valid JSON
async function invokeWithRetry(input, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await chain.invoke(input);
    } catch (e) {
      if (e?.lc_error_code !== "OUTPUT_PARSING_FAILURE") throw e; // auth/network errors: surface them
      console.warn(`(LLM output parse failure, attempt ${i + 1}/${attempts})`);
      if (i === attempts - 1) throw e;
    }
  }
}

// ---------- helpers ----------
const todayIST = () => {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.day}/${values.month}/${values.year}`;
};

const toComparableDate = (date) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
    ? null
    : parsed;
};

// If the LLM "forgets" a station we already confirmed, keep the confirmed one.
const normalizeStation = (station) => {
  if (!station || station.status !== "valid" || typeof station.name !== "string") return station;

  const name = station.name.trim();
  const codeMatch = /\(([A-Za-z0-9]{2,8})\)\s*$/.exec(name);
  return {
    ...station,
    name: (codeMatch ? codeMatch[1] : name).toUpperCase(),
  };
};

const mergeStation = (prev, next) => {
  const normalizedPrev = normalizeStation(prev);
  if (!next) return normalizedPrev;
  return next.status === "missing" && normalizedPrev.status === "valid"
    ? normalizedPrev
    : normalizeStation(next);
};

const toHistory = (messages) =>
  messages.map((m) => (m.role === "human" ? new HumanMessage(m.content) : new AIMessage(m.content)));

// ---------- one turn: user text in -> { done, reply } or { done, result } ----------
async function handleTurn(sessionId, userText) {
  const state = await loadState(sessionId);
  const today = todayIST();

  let out;
  try {
    out = await invokeWithRetry({
      today,
      slots: JSON.stringify(state.slots),
      history: toHistory(state.messages),
      input: userText,
    });
  } catch (e) {
    if (e?.lc_error_code !== "OUTPUT_PARSING_FAILURE") throw e;
    return { done: false, reply: "Sorry, I didn't catch that. Could you say it again?" }; // state untouched
  }

  if (out == null) {
    return {
      done: false,
      reply: "I'm a train ticket assistant. Which station are you travelling from?",
    };
  }

  const parsedOutput = turnSchema.safeParse(out);
  if (!parsedOutput.success) {
    console.warn("LLM returned an incomplete response:", parsedOutput.error.issues);
    return {
      done: false,
      reply:
        typeof out?.reply === "string" && out.reply.trim()
          ? out.reply
          : "I can help with train travel. Which station are you travelling from?",
    };
  }

  out = parsedOutput.data;
  const from = mergeStation(state.slots.from, out.from);
  let to = mergeStation(state.slots.to, out.to);
  let date = out.date ?? state.slots.date;
  let reply = out.reply;

  // Guardrails in code (don't blindly trust the LLM)
  const parsedDate = date && toComparableDate(date);
  const parsedToday = toComparableDate(today);
  if (date && (!parsedDate || !parsedToday || parsedDate < parsedToday)) {
    date = null;
    reply = "That date looks invalid or in the past. Which date would you like to travel?";
  }
  if (from.status === "valid" && to.status === "valid" && from.name === to.name) {
    to = emptyStation();
    reply = "From and To stations can't be the same. Which station are you travelling to?";
  }

  if (from.status === "valid" && to.status === "valid" && date) {
    await redis.del(key(sessionId)); // finished: clean up the session
    return { done: true, result: { from: from.name, to: to.name, date } };
  }

  state.slots = { from, to, date };
  state.messages.push({ role: "human", content: userText });
  state.messages.push({ role: "ai", content: reply });
  await saveState(sessionId, state);
  return { done: false, reply };
}

// ---------- the main function: loops until from, to and date are all collected ----------
/**
 * @param {object}   [opts]
 * @param {string}   [opts.sessionId] Reuse a session to resume a conversation.
 * @param {(botMessage: string) => Promise<string>} [opts.ask]
 *        Shows the bot message and returns the user's reply. Defaults to the terminal.
 * @returns {Promise<{from: string, to: string, date: string}>}
 */
export async function collectJourneyDetails({ sessionId = randomUUID(), ask } = {}) {
  initialize();

  let rl;
  if (!ask) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    ask = (botMessage) => rl.question(`\nBot: ${botMessage}\nYou: `);
  }

  try {
    let botMessage = "Hi! Which station are you travelling from?";
    while (true) {
      const userText = (await ask(botMessage)).trim();
      if (!userText) continue; // ignore empty input, ask again

      try {
        const turn = await handleTurn(sessionId, userText);
        if (turn.done) return turn.result; // all 3 details collected -> stop
        botMessage = turn.reply;
      } catch (err) {
        console.error("Error:", err?.message ?? err);
        botMessage = "Something went wrong. Please try again.";
      }
    }
  } finally {
    rl?.close();
  }
}

export default collectJourneyDetails;

// ---------- run directly: `node bot.js` ----------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await collectJourneyDetails();
  console.log("\nFINAL JSON:");
  console.log(JSON.stringify(result, null, 2));
  await redis.quit();
}