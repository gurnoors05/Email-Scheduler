import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { CheckCircle2, FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CsvUploaderProps {
  value: string[];
  onChange: (emails: string[]) => void;
}

/** Pulls every valid, de-duplicated email out of any column of a parsed CSV. */
function extractEmails(rows: string[][]): string[] {
  const found = new Set<string>();
  for (const row of rows) {
    for (const cell of row) {
      const candidate = (cell ?? "").trim().toLowerCase();
      if (EMAIL_RE.test(candidate)) found.add(candidate);
    }
  }
  return Array.from(found);
}

export function CsvUploader({ value, onChange }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      Papa.parse<string[]>(file, {
        skipEmptyLines: true,
        complete: (result) => {
          const emails = extractEmails(result.data);
          if (emails.length === 0) {
            setFileName(null);
            onChange([]);
            setError("No valid email addresses found in this file.");
            return;
          }
          setFileName(file.name);
          onChange(emails);
        },
        error: () => setError("We couldn't read that file. Please upload a valid CSV."),
      });
    },
    [onChange],
  );

  const clear = () => {
    setFileName(null);
    setError(null);
    onChange([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center transition-colors",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <FileUp className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">
          Drop your leads CSV here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Any column containing email addresses works.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {value.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              {value.length} email {value.length === 1 ? "address" : "addresses"} detected
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          </div>
          {fileName ? (
            <p className="mt-1 text-xs text-muted-foreground">From {fileName}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {value.slice(0, 5).map((email) => (
              <span
                key={email}
                className="max-w-[220px] truncate rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
              >
                {email}
              </span>
            ))}
            {value.length > 5 ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                +{value.length - 5} more
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
