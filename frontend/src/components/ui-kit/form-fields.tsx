"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui-kit/form-section";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dict } from "@/lib/dict";

interface BaseProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  error,
  hint,
  full,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} hint={hint} full={full}>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </FormField>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  rows = 3,
  required,
  error,
  hint,
  full = true,
}: BaseProps & { value: string; onChange: (v: string) => void; rows?: number }) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} hint={hint} full={full}>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </FormField>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
  hint,
  full,
}: BaseProps & {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = useId();
  return (
    <FormField label={label} htmlFor={id} required={required} error={error} hint={hint} full={full}>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder ?? dict.actions.search} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

/** Standard submit + cancel button row for forms. */
export function FormActions({
  saving,
  saveLabel,
  onCancel,
}: {
  saving?: boolean;
  saveLabel?: string;
  onCancel?: () => void;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      <Button type="submit" disabled={saving}>
        {saving ? dict.actions.saving : saveLabel ?? dict.actions.save}
      </Button>
      <Button type="button" variant="outline" onClick={onCancel ?? (() => router.back())}>
        {dict.actions.cancel}
      </Button>
    </div>
  );
}
