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
  ensureEventIdentityFields,
  isIdentityField,
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
    assert.equal(
      eventHandoffFromSearch(
        new URLSearchParams(
          "returnTo=https://admin.yildizskylab.com/events/11111111-1111-4111-8111-111111111111&eventId=11111111-1111-4111-8111-111111111111",
        ),
      ).eventId,
      "11111111-1111-4111-8111-111111111111",
    );
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

  it("locks ad, soyad and email on event-linked schemas", () => {
    const schema = ensureEventIdentityFields([
      { id: "q-ad", type: "short_text", props: { question: "Adınız", required: false } },
      { id: "why", type: "long_text", props: { question: "Neden?", required: false } },
    ]);
    assert.equal(schema[0].id, "q-ad");
    assert.equal(schema[0].props.identity, "firstName");
    assert.equal(schema[0].props.required, true);
    assert.equal(schema[1].props.identity, "lastName");
    assert.equal(schema[1].props.question, "Soyad");
    assert.equal(schema[2].props.identity, "email");
    assert.equal(schema[2].props.inputType, "email");
    assert.equal(schema[3].id, "why");
    assert.equal(isIdentityField(schema[3]), false);
    const again = ensureEventIdentityFields(schema);
    assert.equal(again.filter((field) => isIdentityField(field)).length, 3);
    const empty = ensureEventIdentityFields([]);
    assert.equal(empty[0].id, "identity:firstName");
    assert.equal(empty[2].id, "identity:email");
  });
});
