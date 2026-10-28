import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleTurn } from "./llm/agent.js";
import { run } from "./scraper/search.js";
import { rateLimit } from "./rateLimit.js";
import {
  chatRequestSchema,
  searchRequestSchema,
  validateBody,
} from "./validation.js";

const app = express();

app.set("trust proxy", process.env.TRUST_PROXY === "true");
app.use(cors());
app.use(express.json({ limit: "16kb" }));

app.post(
  "/api/chat",
  validateBody(chatRequestSchema),
  rateLimit("chat"),
  async (req, res) => {
    try {
      const { sessionId, message } = req.body;

      const turn = await handleTurn(sessionId, message);

      if (!turn.done) {
        return res.json({
          reply: turn.reply,
          done: false,
          searching: false,
        });
      }

      return res.json({
        reply: [
          "I have these journey details:",
          `From: ${turn.result.from}`,
          `To: ${turn.result.to}`,
          `Date: ${turn.result.date}`,
          "",
          "Starting the search now...",
        ].join("\n"),
        done: true,
        searching: true,
        journey: turn.result,
      });
    } catch (error) {
      console.error("Chat request failed:", error);

      return res.status(500).json({
        error: "Unable to process your request.",
      });
    }
  },
);

app.post(
  "/api/search",
  validateBody(searchRequestSchema),
  rateLimit("search"),
  async (req, res) => {
    try {
      const { from, to, date } = req.body;

      const results = await run({ from, to, date });

      return res.json({
        reply: "Here are the available trains.",
        followUp: "Would you like to search for another journey?",
        searching: false,
        results,
      });
    } catch (error) {
      console.error("Search request failed:", error);

      return res.status(500).json({
        error: "Unable to complete the train search.",
      });
    }
  },
);

app.use((error, req, res, next) => {
  if (error?.type === "entity.too.large") {
    return res.status(400).json({
      error: "Request body is too large.",
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: "Request body must contain valid JSON.",
    });
  }

  return next(error);
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log("API running on port " + port);
});

app.get("/", (req, res) => {
  res.send("Hello! The API is running.");
});