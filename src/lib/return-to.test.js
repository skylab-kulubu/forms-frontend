import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ADMIN_ORIGIN,
  DEFAULT_FORMS_ORIGIN,
  captureReturnTo,
  editPathWithReturnTo,
  publicFormUrl,
  readStoredReturnTo,
  returnToEventHref,
  sanitizeReturnTo,
} from "./return-to.js";

describe("skyforms returnTo", () => {
  it("only accepts the club admin origin", () => {
    assert.equal(
      sanitizeReturnTo("https://admin.yildizskylab.com/events/e1?formSlot=apply"),
      "https://admin.yildizskylab.com/events/e1?formSlot=apply",
    );
    assert.equal(sanitizeReturnTo("https://evil.example/steal"), null);
    assert.equal(sanitizeReturnTo("javascript:alert(1)"), null);
    assert.equal(
      sanitizeReturnTo("http://localhost:3000/events/e1", "http://localhost:3000"),
      "http://localhost:3000/events/e1",
    );
  });

  it("stores a valid returnTo and builds the event attach href", () => {
    const storage = new Map();
    const bag = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    };
    const saved = captureReturnTo(
      "https://admin.yildizskylab.com/events/e1?formSlot=apply",
      bag,
    );
    assert.equal(readStoredReturnTo(bag), saved);
    assert.equal(
      returnToEventHref(saved, "form-1"),
      "https://admin.yildizskylab.com/events/e1?formSlot=apply&formUrl=https%3A%2F%2Fforms.yildizskylab.com%2Fform-1",
    );
    assert.equal(publicFormUrl("form-1"), `${DEFAULT_FORMS_ORIGIN}/form-1`);
    assert.equal(
      editPathWithReturnTo("form-1", saved),
      `/admin/forms/form-1/edit?returnTo=${encodeURIComponent(saved)}`,
    );
    assert.equal(DEFAULT_ADMIN_ORIGIN, "https://admin.yildizskylab.com");
  });
});
