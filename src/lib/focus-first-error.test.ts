import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AuthField } from "@/components/auth/auth-field";
import { focusFirstInvalid } from "@/lib/focus-first-error";

const asRoot = (querySelector: () => unknown) => ({ querySelector }) as unknown as ParentNode;

describe("focusFirstInvalid", () => {
  it("focuses the first aria-invalid field", () => {
    const focus = vi.fn();
    const querySelector = vi.fn(() => ({ focus }));
    focusFirstInvalid(asRoot(querySelector));
    expect(querySelector).toHaveBeenCalledWith('[aria-invalid="true"]');
    expect(focus).toHaveBeenCalledOnce();
  });

  it("does nothing without a form or an invalid field", () => {
    expect(() => focusFirstInvalid(null)).not.toThrow();
    expect(() => focusFirstInvalid(asRoot(() => null))).not.toThrow();
  });
});

describe("AuthField error link", () => {
  const props = { id: "f", name: "f", label: "F", value: "", onChange: () => {} };

  it("points aria-describedby at the error text while an error shows", () => {
    const html = renderToStaticMarkup(createElement(AuthField, { ...props, error: "Bad" }));
    expect(html).toContain('aria-describedby="f-error"');
    expect(html).toContain('id="f-error"');
  });

  it("omits aria-describedby without an error", () => {
    const html = renderToStaticMarkup(createElement(AuthField, props));
    expect(html).not.toContain("aria-describedby");
  });
});
