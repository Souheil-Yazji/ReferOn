import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  StatusTransitionError,
} from "../../src/lib/referralStateMachine.js";

describe("canTransition", () => {
  it("allows draft → previewed", () => {
    expect(canTransition("draft", "previewed")).toBe(true);
  });

  it("allows previewed → selected_specialist", () => {
    expect(canTransition("previewed", "selected_specialist")).toBe(true);
  });

  it("allows selected_specialist → pending", () => {
    expect(canTransition("selected_specialist", "pending")).toBe(true);
  });

  it("allows pending → sent", () => {
    expect(canTransition("pending", "sent")).toBe(true);
  });

  it("allows sent → approved", () => {
    expect(canTransition("sent", "approved")).toBe(true);
  });

  it("allows sent → rejected", () => {
    expect(canTransition("sent", "rejected")).toBe(true);
  });

  it("allows rejected → draft (resubmit)", () => {
    expect(canTransition("rejected", "draft")).toBe(true);
  });

  it("allows previewed → draft (edit back)", () => {
    expect(canTransition("previewed", "draft")).toBe(true);
  });

  it("disallows draft → sent (skip steps)", () => {
    expect(canTransition("draft", "sent")).toBe(false);
  });

  it("disallows approved → anything", () => {
    expect(canTransition("approved", "draft")).toBe(false);
    expect(canTransition("approved", "rejected")).toBe(false);
  });

  it("disallows draft → approved", () => {
    expect(canTransition("draft", "approved")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("does not throw for valid transitions", () => {
    expect(() => assertTransition("draft", "previewed")).not.toThrow();
  });

  it("throws StatusTransitionError for invalid transitions", () => {
    expect(() => assertTransition("draft", "approved")).toThrow(
      StatusTransitionError
    );
  });

  it("error message includes both states", () => {
    try {
      assertTransition("approved", "draft");
    } catch (err) {
      expect(err).toBeInstanceOf(StatusTransitionError);
      expect((err as StatusTransitionError).message).toContain("approved");
      expect((err as StatusTransitionError).message).toContain("draft");
      expect((err as StatusTransitionError).statusCode).toBe(409);
    }
  });
});
