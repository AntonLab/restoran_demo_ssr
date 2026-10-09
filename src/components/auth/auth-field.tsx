import { FieldError, fieldClass } from "@/components/feedback/field";

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
};

// Controlled: React 19 resets the form after the action, which would wipe inputs on any error.
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={fieldClass}
      />
      <FieldError message={error} />
    </div>
  );
}
