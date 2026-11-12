import { test } from "node:test";
import assert from "node:assert/strict";
import { maskPhone, normalizeIndianMobile, normalizeLookupPhone, normalizePhone } from "./format.ts";

test("Indian mobiles in common formats", () => {
  for (const v of ["9840012345", "98400 12345", "+91 98400 12345", "09840012345", "919840012345"]) {
    assert.equal(normalizeIndianMobile(v), "+919840012345", v);
  }
  assert.equal(normalizeIndianMobile("12345"), null);
  assert.equal(normalizeIndianMobile("5840012345"), null); // must start 6-9
});

test("international numbers with a country code", () => {
  assert.equal(normalizePhone("91", "98400 12345"), "+919840012345");
  assert.equal(normalizePhone("971", "050 123 4567"), "+971501234567"); // trunk 0 dropped
  assert.equal(normalizePhone("971", "+971 50 123 4567"), "+971501234567"); // code typed twice
  assert.equal(normalizePhone("44", "07700 900123"), "+447700900123");
  assert.equal(normalizePhone("1", "(415) 555-0134"), "+14155550134");
  assert.equal(normalizePhone("971", "123"), null);
  assert.equal(normalizePhone("91", "12345"), null);
});

test("lookups accept Indian or +international", () => {
  assert.equal(normalizeLookupPhone("98400 12345"), "+919840012345");
  assert.equal(normalizeLookupPhone("+971 50 123 4567"), "+971501234567");
  assert.equal(normalizeLookupPhone("00971501234567"), "+971501234567");
  assert.equal(normalizeLookupPhone("SC-0042"), null);
});

test("masking hides the middle digits", () => {
  assert.equal(maskPhone("+919840012345"), "+91 98XXX XX345");
  assert.equal(maskPhone("+971501234567"), "+97150 XXXX 567");
});
