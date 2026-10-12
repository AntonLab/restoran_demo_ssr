const FOCUSABLE =
  '[tabindex="0"], input:not([type="hidden"]), button:not([tabindex="-1"]), select, textarea';

// A group such as role="radiogroup" carries aria-invalid but is not focusable itself.
export function focusFirstInvalid(form: ParentNode | null) {
  const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!invalid) return;
  const target = invalid.matches(FOCUSABLE)
    ? invalid
    : invalid.querySelector<HTMLElement>(FOCUSABLE);
  target?.focus();
}
