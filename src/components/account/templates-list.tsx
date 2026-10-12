"use client";

import { useState, useTransition } from "react";
import { deleteTemplateAction } from "@/app/account/templates/actions";
import { ConfirmDialog } from "@/components/account/confirm-dialog";
import { TemplateForm } from "@/components/account/template-form";
import { Button } from "@/components/ui/button";
import type { TemplateView } from "@/lib/template-offer";

export function TemplatesList({
  templates,
  atLimit,
  limit,
}: {
  templates: TemplateView[];
  atLimit: boolean;
  limit: number;
}) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<TemplateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const close = () => setEditing(null);

  const askDelete = (t: TemplateView) => {
    setError(null);
    setDeleting(t);
  };

  const confirm = () => {
    if (!deleting) return;
    const { id } = deleting;
    startTransition(async () => {
      try {
        const r = await deleteTemplateAction(id);
        if (r.ok) setDeleting(null);
        else setError(r.error);
      } catch {
        setError("Could not delete the template. Try again.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {atLimit ? (
        <p className="text-sm text-muted-foreground">
          Template limit reached ({limit} of {limit}). Delete one to add another.
        </p>
      ) : (
        <Button className="self-start" onClick={() => setEditing("new")}>
          Add template
        </Button>
      )}
      {editing === "new" && <TemplateForm key="new" onDone={close} />}
      {templates.length === 0 ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">No templates yet</h2>
          <p className="text-muted-foreground">Save one at checkout or add it here.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {templates.map((t) => (
            <li key={t.id}>
              {editing === t.id ? (
                <TemplateForm key={t.id} template={t} onDone={close} />
              ) : (
                <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{t.address}</p>
                    <p className="text-sm break-words text-muted-foreground">
                      {t.name}, {t.phone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Edit template ${t.address}`}
                      onClick={() => setEditing(t.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Delete template ${t.address}`}
                      onClick={() => askDelete(t)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (open) return;
          setDeleting(null);
          setError(null);
        }}
        title="Delete this template?"
        description={deleting?.address ?? ""}
        confirmLabel="Delete"
        keepLabel="Keep"
        pending={pending}
        error={error}
        onConfirm={confirm}
      />
    </div>
  );
}
