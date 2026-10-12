import type { AccountFormState } from "@/app/account/actions";
import { Button } from "@/components/ui/button";

export function FormFooter({
  state,
  pending,
  label,
}: {
  state: AccountFormState;
  pending: boolean;
  label: string;
}) {
  return (
    <>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.status === "success" && <output className="block text-sm">{state.message}</output>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : label}
      </Button>
    </>
  );
}
