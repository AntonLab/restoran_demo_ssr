import { FieldError, errorId, fieldClass } from "@/components/feedback/field";

type Props = {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "tel";
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  maxLength?: number;
  inputMode?: "numeric";
};

// Controlled: see feedback/field.tsx.
export function AuthField({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
  required,
  maxLength,
  inputMode,
}: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId(id) : undefined}
        className={fieldClass}
      />
      <FieldError id={errorId(id)} message={error} />
    </div>
  );
}
