import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CORE_API_URL,
  DEFAULT_SHORT_ORIGIN,
  coreApiUrl,
  existingShortFor,
  normalizeDest,
  publicShortUrl,
  shortOrigin,
  shortenFormUrl,
} from "./short-url.js";

describe("skyl.app form share", () => {
  it("builds the public short link on skyl.app, not a logged-in console", () => {
    assert.equal(DEFAULT_SHORT_ORIGIN, "https://skyl.app");
    assert.equal(DEFAULT_CORE_API_URL, "https://api.yildizskylab.com");
    assert.equal(shortOrigin(""), "https://skyl.app");
    assert.equal(shortOrigin("https://skyl.app/"), "https://skyl.app");
    assert.equal(publicShortUrl("gecekodu-skydays2026"), "https://skyl.app/gecekodu-skydays2026");
    assert.equal(coreApiUrl(""), "https://api.yildizskylab.com");
    assert.equal(coreApiUrl("https://api.example.test/"), "https://api.example.test");
  });

  it("reuses an existing alias when the public form URL already has a short row", () => {
    const row = {
      id: "u1",
      alias: "jam2026",
      url: "https://forms.yildizskylab.com/form-1/",
      clickCount: 0,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    assert.equal(normalizeDest("https://forms.yildizskylab.com/form-1/"), "https://forms.yildizskylab.com/form-1");
    assert.equal(existingShortFor("https://forms.yildizskylab.com/form-1", "", [row])?.alias, "jam2026");
    assert.equal(existingShortFor("", "jam2026", [row])?.id, "u1");
    assert.equal(existingShortFor("https://other.example/form-1", "", [row]), undefined);
  });

  it("returns the existing short row instead of minting a second alias", async () => {
    const dest = "https://forms.yildizskylab.com/form-1";
    const row = {
      id: "u1",
      alias: "form1",
      url: dest,
      clickCount: 2,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    const created = await shortenFormUrl(
      {
        listMine: async () => [row],
        create: async () => {
          throw new Error("should reuse");
        },
      },
      dest,
    );
    assert.equal(created.alias, "form1");
    assert.equal(publicShortUrl(created.alias), "https://skyl.app/form1");
  });

  it("creates a core alias when none exists for that destination", async () => {
    const dest = "https://forms.yildizskylab.com/form-2";
    const created = await shortenFormUrl(
      {
        listMine: async () => [],
        create: async (body) => {
          assert.equal(body.url, dest);
          assert.equal(body.alias, undefined);
          return {
            id: "u2",
            alias: "AbCd1234",
            url: body.url,
            clickCount: 0,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          };
        },
      },
      dest,
    );
    assert.equal(created.alias, "AbCd1234");
  });

  it("still creates when listing mine is forbidden", async () => {
    const dest = "https://forms.yildizskylab.com/form-3";
    const err = new Error("Forbidden");
    err.status = 403;
    const created = await shortenFormUrl(
      {
        listMine: async () => {
          throw err;
        },
        create: async (body) => ({
          id: "u3",
          alias: "newalias",
          url: body.url,
          clickCount: 0,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        }),
      },
      dest,
    );
    assert.equal(created.alias, "newalias");
  });

  it("reuses the row after a create conflict for the same destination", async () => {
    const dest = "https://forms.yildizskylab.com/form-4";
    const row = {
      id: "u4",
      alias: "taken",
      url: dest,
      clickCount: 0,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    };
    let listed = 0;
    const conflict = new Error("Conflict");
    conflict.status = 409;
    const created = await shortenFormUrl(
      {
        listMine: async () => {
          listed += 1;
          return listed === 1 ? [] : [row];
        },
        create: async () => {
          throw conflict;
        },
      },
      dest,
    );
    assert.equal(created.alias, "taken");
    assert.equal(listed, 2);
  });
});
