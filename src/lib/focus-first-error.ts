export function focusFirstInvalid(form: ParentNode | null) {
  form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}
