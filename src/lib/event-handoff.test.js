import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FORM_STATUS_OPEN,
  cloneSchema,
  eventHandoffFromSearch,
  matchesGroupTemplate,
  pickTemplateGroup,
  readNewFormDraft,
  writeNewFormDraft,
} from "./event-handoff.js";

describe("event handoff seed", () => {
  it("opens event-linked drafts and keeps standalone forms untouched", () => {
    const linked = eventHandoffFromSearch(
      new URLSearchParams(
        "returnTo=https://admin.yildizskylab.com/events/e1&title=GECEKODU%20SkyDays%202026&ownerTeam=GECEKODU",
      ),
    );
    assert.equal(linked.eventLinked, true);
    assert.equal(linked.open, true);
    assert.equal(linked.title, "GECEKODU SkyDays 2026");
    assert.equal(linked.ownerTeam, "GECEKODU");
    assert.equal(eventHandoffFromSearch(new URLSearchParams()).eventLinked, false);
    assert.equal(eventHandoffFromSearch(new URLSearchParams()).open, false);
    assert.equal(
      eventHandoffFromSearch(new URLSearchParams("returnTo=https://admin.yildizskylab.com/events/e1&published=0"))
        .open,
      false,
    );
  });

  it("clones schema with new field ids so the source form is not mutated", () => {
    const source = [{ id: "old", type: "short_text", props: { question: "Ad" } }];
    const cloned = cloneSchema(source, () => "new-id");
    assert.equal(cloned[0].id, "new-id");
    assert.equal(cloned[0].props.question, "Ad");
    cloned[0].props.question = "Soyad";
    assert.equal(source[0].props.question, "Ad");
  });

  it("matches a Gecekodu group template by folded title", () => {
    assert.equal(matchesGroupTemplate("GeceKodu başvuru", "GECEKODU"), true);
    assert.equal(matchesGroupTemplate("WEBLAB", "GECEKODU"), false);
    const picked = pickTemplateGroup(
      [
        { title: "WEBLAB", schema: [{ id: "1" }] },
        { title: "GECEKODU", schema: [{ id: "a", type: "short_text", props: {} }] },
      ],
      "GECEKODU",
    );
    assert.equal(picked.title, "GECEKODU");
  });

  it("round-trips a local previous draft", () => {
    const bag = new Map();
    const storage = {
      getItem: (key) => bag.get(key) ?? null,
      setItem: (key, value) => bag.set(key, value),
    };
    const returnTo = "https://admin.yildizskylab.com/events/e1";
    writeNewFormDraft(storage, returnTo, {
      title: "SkyDays",
      schema: [{ id: "q1", type: "short_text", props: {} }],
      status: FORM_STATUS_OPEN,
    });
    const loaded = readNewFormDraft(storage, returnTo);
    assert.equal(loaded.title, "SkyDays");
    assert.equal(loaded.schema[0].id, "q1");
  });
});
