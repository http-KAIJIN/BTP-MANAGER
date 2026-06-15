import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Number of columns on >= sm screens. */
  columns?: 1 | 2;
  className?: string;
}

/**
 * A titled card grouping related form fields. Multiple sections stack to form a
 * professional multi-section form layout.
 */
export function FormSection({
  title,
  description,
  children,
  columns = 1,
  className,
}: FormSectionProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-bold">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "grid gap-x-4 gap-y-5",
            columns === 2 && "sm:grid-cols-2",
          )}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  /** Span both columns of a 2-col section. */
  full?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Consistent field wrapper: label (+ required marker), control, and hint/error text.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  full,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
