import assert from "node:assert/strict";
import { describe, it } from "mocha";
import {
  chatRequestSchema,
  searchRequestSchema,
} from "../validation.js";

const sessionId = "123e4567-e89b-12d3-a456-426614174000";

describe("request schemas", () => {
  it("trims valid chat input", () => {
    const result = chatRequestSchema.safeParse({
      sessionId,
      message: "  Find a train  ",
    });

    assert.equal(result.success, true);
    assert.equal(result.data.message, "Find a train");
  });

  it("rejects blank and oversized messages", () => {
    assert.equal(
      chatRequestSchema.safeParse({ sessionId, message: " " }).success,
      false,
    );
    assert.equal(
      chatRequestSchema.safeParse({ sessionId, message: "x".repeat(2_001) })
        .success,
      false,
    );
  });

  it("rejects invalid session IDs and unexpected fields", () => {
    const result = searchRequestSchema.safeParse({
      sessionId: "not-a-uuid",
      from: "NDLS",
      to: "BCT",
      date: "25/12/2026",
      extra: true,
    });

    assert.equal(result.success, false);
  });
});
