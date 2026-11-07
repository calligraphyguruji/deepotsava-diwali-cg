import test from "node:test";
import assert from "node:assert/strict";
import { greeting, whatsappLink, wrapText } from "./greetings.js";
test("all four greeting styles preserve names and produce distinct messages", () => {
  const messages = new Set();
  for (const style of ["Traditional", "Romantic", "Family", "Friends"]) {
    const value = greeting(" Asha ", " Priya ", style);
    assert.ok(value.startsWith("Dear Priya,"));
    assert.ok(value.endsWith("With love, Asha."));
    messages.add(value);
  }
  assert.equal(messages.size, 4);
});
test("blank names and unknown style have meaningful defaults", () => {
  const value = greeting(" ", " ", "missing");
  assert.ok(value.startsWith("Dear someone special,"));
  assert.ok(value.includes("prosperity"));
  assert.ok(!value.includes("With love,"));
});
test("WhatsApp link safely encodes Unicode and special characters", () => {
  const text = "प्रिय मित्र 🪔 & love? #Diwali";
  const url = new URL(whatsappLink(text));
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.searchParams.get("text"), text);
});
test("PNG text wraps long unbroken names and normal words within width", () => {
  const c = { measureText: (text) => ({ width: [...text].length * 10 }) };
  const lines = wrapText(c, "Dear " + "a".repeat(60) + " happy Diwali", 100);
  assert.ok(lines.length > 5);
  assert.ok(lines.every((line) => c.measureText(line).width <= 100));
  assert.equal(
    lines.join("").replaceAll(" ", ""),
    ("Dear " + "a".repeat(60) + " happy Diwali").replaceAll(" ", ""),
  );
});
