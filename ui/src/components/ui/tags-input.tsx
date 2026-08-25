"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Delimiter, TagInput, type Tag } from "emblor-maintained";
import { cn } from "@/lib/utils";

function toTags(values: string[]): Tag[] {
  return values.map((value) => ({
    id: value.toLowerCase(),
    text: value,
  }));
}

function fromTags(tags: Tag[]): string[] {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const tag of tags) {
    const text = tag.text.trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    values.push(text);
  }
  return values;
}

export function TagsInput({
  value,
  onChange,
  placeholder = "Type a value and press Enter",
  disabled,
  className,
  id,
  validate,
}: {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  validate?: (value: string) => boolean;
}) {
  const [tags, setTags] = useState<Tag[]>(() => toTags(value));
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  useEffect(() => {
    const next = toTags(value);
    const current = fromTags(tags).join("\0");
    const incoming = fromTags(next).join("\0");
    if (current !== incoming) setTags(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync from parent value only
  }, [value]);

  function updateTags(next: Tag[] | ((prev: Tag[]) => Tag[])) {
    const resolved = typeof next === "function" ? next(tags) : next;
    setTags(resolved);
    onChange(fromTags(resolved));
  }

  function removeTag(tagId: string) {
    updateTags((prev) => prev.filter((tag) => tag.id !== tagId));
  }

  return (
    <TagInput
      id={id}
      tags={tags}
      setTags={updateTags}
      activeTagIndex={activeTagIndex}
      setActiveTagIndex={setActiveTagIndex}
      placeholder={placeholder}
      disabled={disabled}
      delimiter={Delimiter.Enter}
      delimiterList={[",", ";", " "]}
      addOnPaste
      addTagsOnBlur
      allowDuplicates={false}
      validateTag={(tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return false;
        return validate ? validate(trimmed) : true;
      }}
      inlineTags
      customTagRenderer={(tag, isActiveTag) => (
        <span
          key={tag.id}
          className={cn(
            "inline-flex h-7 max-w-full items-center gap-1 rounded-md border border-border bg-muted px-2 text-xs font-medium text-foreground",
            isActiveTag && "ring-2 ring-ring/40",
            disabled && "opacity-60",
          )}
        >
          <span className="truncate">{tag.text}</span>
          <button
            type="button"
            aria-label={`Remove ${tag.text}`}
            disabled={disabled}
            className={cn(
              "inline-flex size-4 shrink-0 items-center justify-center rounded-sm",
              "text-foreground/70 hover:bg-background hover:text-foreground",
              "dark:text-foreground/80 dark:hover:bg-background/40 dark:hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-40",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              removeTag(tag.id);
            }}
          >
            <X className="size-3 stroke-[2.5]" aria-hidden />
          </button>
        </span>
      )}
      styleClasses={{
        inlineTagsContainer: cn(
          "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
          className,
        ),
        input:
          "min-w-[12rem] flex-1 border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-0",
      }}
    />
  );
}
