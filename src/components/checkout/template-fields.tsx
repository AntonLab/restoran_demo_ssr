"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SaveOffer, TemplateView } from "@/lib/template-offer";

export function TemplatePicker({
  templates,
  value,
  onChange,
}: {
  templates: TemplateView[];
  value: string;
  onChange: (id: string) => void;
}) {
  if (templates.length === 0) return null;
  const items = templates.map((t) => ({ value: t.id, label: t.address }));

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id="saved-address-label" className="text-sm font-medium">
        Saved address
      </span>
      {/* No name: the picker only fills the fields and must not be submitted. */}
      <Select items={items} value={value} onValueChange={(next) => next !== null && onChange(next)}>
        <SelectTrigger aria-labelledby="saved-address-label" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SaveTemplateOption({
  offer,
  checked,
  onChange,
}: {
  offer: SaveOffer;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  if (offer === "none") return null;
  if (offer === "limit") {
    return (
      <p className="text-sm text-muted-foreground">
        Template limit reached —{" "}
        <Link href="/account/templates" className="underline underline-offset-4">
          manage in Account
        </Link>
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="checkout-save-template"
        name="saveTemplate"
        checked={checked}
        onCheckedChange={onChange}
      />
      <label htmlFor="checkout-save-template" className="text-sm">
        Save as template
      </label>
    </div>
  );
}
