"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Search, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { dict } from "@/lib/dict";

/** Standard list toolbar: a search box (RTL: icon at the start) + optional filter slot. */
export function TableToolbar({
  search,
  onSearch,
  placeholder = dict.actions.search,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="ps-9"
        />
      </div>
      {children}
    </div>
  );
}

/** Consistent status/category filter dropdown built on shadcn Select. */
export function FilterSelect({
  value,
  onValueChange,
  options,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("h-9 w-full sm:w-48", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Edit + delete actions for a table row (inline-end aligned). */
export function RowActions({
  editHref,
  onDelete,
}: {
  editHref: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button asChild variant="outline" size="sm" className="h-8">
        <Link href={editHref} onClick={(e) => e.stopPropagation()}>
          <Pencil className="size-3.5" />
          {dict.actions.edit}
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="size-3.5" />
        {dict.actions.delete}
      </Button>
    </div>
  );
}
