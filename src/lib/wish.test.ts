import { describe, expect, it } from "vitest";
import { wishInput, wishPrompt } from "./wish";

describe("personalized Diwali wishes", () => {
  it("requires a recipient name", () => {
    expect(wishInput.safeParse({ recipient: "  ", note: "Thank you for your friendship" }).success).toBe(false);
  });
  it("requires a personal note", () => {
    expect(wishInput.safeParse({ recipient: "Anji", note: " " }).success).toBe(false);
  });
  it("passes the visitor's recipient and note to the personalization prompt", () => {
    const prompt = wishPrompt(wishInput.parse({ recipient: " Anji ", note: " Thank you for always making me laugh. " }));
    expect(prompt).toContain('"recipient":"Anji"');
    expect(prompt).toContain('"note":"Thank you for always making me laugh."');
  });
});