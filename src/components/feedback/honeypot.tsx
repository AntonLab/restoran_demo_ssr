import { HONEYPOT_FIELD } from "@/lib/feedback-schemas";

// Off-screen, not display:none: some bots skip hidden fields.
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px]">
      <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
    </div>
  );
}
