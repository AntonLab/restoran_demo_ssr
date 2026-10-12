import { describe, expect, test } from "vitest";
import { saveOffer } from "@/lib/template-offer";

const ann = { name: "Ann", phone: "+15551234567", address: "12 Main Street" };
const base = { isUser: true, atLimit: false, templates: [ann], current: ann };

describe("saveOffer", () => {
  test("a Guest is never offered a template", () => {
    expect(saveOffer({ ...base, isUser: false, templates: [], current: ann })).toBe("none");
  });
  test("a combination that already matches a template is not offered again", () => {
    expect(saveOffer(base)).toBe("none");
    expect(
      saveOffer({ ...base, current: { ...ann, phone: "+1 (555) 123-4567", name: " Ann " } }),
    ).toBe("none");
  });
  test("a new combination is offered", () => {
    expect(saveOffer({ ...base, current: { ...ann, address: "99 Side Road" } })).toBe("offer");
    expect(saveOffer({ ...base, templates: [] })).toBe("offer");
  });
  test("at the limit a new combination gets the limit message instead", () => {
    expect(
      saveOffer({ ...base, atLimit: true, current: { ...ann, address: "99 Side Road" } }),
    ).toBe("limit");
  });
  test("a match wins over the limit", () => {
    expect(saveOffer({ ...base, atLimit: true })).toBe("none");
  });
});
