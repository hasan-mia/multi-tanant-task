"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_ACCEPT =
  "image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf";
const MAX_BYTES = 5 * 1024 * 1024;

export type DocumentUploadValue = File | null;

export function DocumentUploadField({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  disabled,
  className,
  emptyLabel = "Click to upload or drop a file",
  hint = "JPG, PNG, WEBP, or PDF · max 5MB",
}: {
  value: DocumentUploadValue;
  onChange: (file: DocumentUploadValue) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  emptyLabel?: string;
  hint?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );
  const isImage = Boolean(value?.type.startsWith("image/"));

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function applyFile(file: File | null | undefined) {
    if (!file) {
      onChange(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File must be 5MB or less");
      onChange(null);
      return;
    }
    onChange(file);
  }

  return (
    <div
      className={cn("w-full", className)}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        applyFile(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          applyFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {!value ? (
        <label
          htmlFor={inputId}
          className={cn(
            "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/5",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {emptyLabel}
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </label>
      ) : (
        <div className="overflow-hidden rounded-lg border border-dashed border-border bg-muted/20">
          <div className="flex items-center gap-3 px-3 py-3">
            {isImage && previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt={value.name}
                className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {value.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(value.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                disabled={disabled}
                aria-label="Remove file"
                onClick={() => onChange(null)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { MAX_BYTES as KYC_MAX_FILE_BYTES, DEFAULT_ACCEPT as KYC_ACCEPT };
