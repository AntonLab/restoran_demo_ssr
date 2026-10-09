import type { ReactNode } from "react";

const field =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

export function FieldError({ message }: { message?: string }) {
  return (
    message && (
      <p role="alert" className="text-sm text-destructive">
        {message}
      </p>
    )
  );
}

function Labelled({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

type Props = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
};

// Inputs are controlled: React 19 resets the form after the action, which would wipe them on any error.
export function CountedTextarea({ id, name, label, value, onChange, error, required }: Props) {
  return (
    <Labelled id={id} label={label}>
      <textarea
        id={id}
        name={name}
        rows={4}
        required={required}
        maxLength={1000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={field}
      />
      <span className="self-end text-xs text-muted-foreground">{value.length}/1000</span>
      <FieldError message={error} />
    </Labelled>
  );
}

export function ContactInput({ id, name, label, value, onChange, error, required }: Props) {
  return (
    <Labelled id={id} label={label}>
      <input
        id={id}
        name={name}
        required={required}
        maxLength={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={field}
      />
      <FieldError message={error} />
    </Labelled>
  );
}
