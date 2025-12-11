"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { cn, addSpacesBeforeCapitals } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { CSVIcon } from "../icons";


// ============================================================================
// Simple Stepper (vertical only, reusing styles from MultiStepForm)
// ============================================================================

import { Check } from 'lucide-react';
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { useToast } from "./toast-context";

type StepState = "completed" | "active" | "inactive";

interface CsvStepperProps {
  currentStep: number;
  steps: { title: string; description?: string }[];
}

function CsvStepper({ currentStep, steps }: CsvStepperProps) {
  return (
    <div className="flex flex-col h-full min-w-[220px]" aria-label="Upload steps">
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const state: StepState =
          stepIndex < currentStep
            ? "completed"
            : stepIndex === currentStep
              ? "active"
              : "inactive";

        return (
          <div key={step.title} className="flex items-start gap-3 relative flex-1">
            {/* Indicator */}
            <div className="flex flex-col items-center h-full">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors shrink-0",
                  state === "active" && "border-primary bg-primary text-primary-foreground",
                  state === "completed" && "border-green-500 bg-green-500 text-white",
                  state === "inactive" && "border-gray-300 bg-background text-gray-500",
                )}
                aria-current={state === "active" ? "step" : undefined}
              >
                {state === "completed" ? (
                  <Check className="size-4 stroke-3" />
                ) : (
                  stepIndex
                )}
              </span>

              {/* Separator line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mt-2 w-0.5 flex-1 transition-colors",
                    state === "completed" ? "bg-green-500" : "bg-gray-300"
                  )}
                />
              )}
            </div>

            {/* Label */}
            <div className="space-y-1 pt-1">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  state === "active" && "text-foreground",
                  state === "completed" && "text-foreground",
                  state === "inactive" && "text-muted-foreground",
                )}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CsvStepper;

// ============================================================================
// Types
// ============================================================================

export type CsvColumnType = "string" | "number" | "boolean" | "date" | "enum";

export interface CsvFieldConfig<TInsert extends Record<string, any>> {
  /** Key from the inferred Drizzle insert type, e.g. keyof NewContact */
  key: keyof TInsert & string;
  /** Human label to show in the UI; falls back to prettified key */
  label?: string;
  /** Is this column required (i.e. .notNull() in Drizzle) */
  required?: boolean;
  /** Basic runtime type hint used for parsing */
  type: CsvColumnType;
  /** Optional description/help text */
  description?: string;
  /** Optional enum values for select / validation */
  enumValues?: readonly string[];
  /** Optional custom parser. Return null/undefined to treat as empty. */
  parse?: (raw: string) => TInsert[keyof TInsert] | null | undefined;
}

export interface CsvUploaderProps<TInsert extends Record<string, any>> {
  /** Name of the entity being uploaded, e.g. "Contacts". Only used for copy. */
  entityName: string;
  /** Configuration for the columns based on Drizzle's $inferInsert type. */
  fields: CsvFieldConfig<TInsert>[];
  /** Maximum accepted file size in MB (default: 5MB). */
  maxFileSizeMb?: number;
  /** Server action or mutation that will receive the parsed and mapped rows. */
  onSubmit: (rows: TInsert[]) => Promise<void> | void;
}

// ============================================================================
// Helpers
// ============================================================================

interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

const isRowEmpty = (row: string[]) => row.every((cell) => cell.trim().length === 0);

// RFC4180-ish CSV parser with support for quoted fields, commas and newlines.
// It parses the whole text character-by-character so newlines inside quotes work.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === "\"") {
      const nextChar = text[i + 1];
      if (inQuotes && nextChar === "\"") {
        // Escaped quote ""
        field += "\"";
        i++; // skip second quote
      } else {
        // Toggle quoted state
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      // Treat CRLF as a single newline
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      row.push(field);
      field = "";
      if (row.length > 0) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  // Flush last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
  }
  if (row.length > 0) {
    rows.push(row);
  }

  return rows;
}

function basicCsvParse(text: string): ParsedCsv {
  const rawRows = parseCsv(text);
  const rows = rawRows.filter(
    (r) => r.length && !(r.length === 1 && r[0].trim().length === 0),
  );

  if (!rows.length) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => h.replace(/^"|"$/g, "").trim());

  return { headers, rows: dataRows };
}

function defaultParseByType(type: CsvColumnType, raw: string): any {
  const value = raw.trim();
  if (value === "") return null;

  switch (type) {
    case "number": {
      const n = Number(value.replace(/,/g, ""));
      return Number.isNaN(n) ? null : n;
    }
    case "boolean": {
      const v = value.toLowerCase();
      if (["true", "yes", "1", "y"].includes(v)) return true;
      if (["false", "no", "0", "n"].includes(v)) return false;
      return null;
    }
    case "date": {
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    case "enum":
    case "string":
    default:
      return value;
  }
}

// ============================================================================
// Main Reusable CSV Uploader
// ============================================================================

export function ReusableCSVUploader<TInsert extends Record<string, any>>({
  entityName,
  fields,
  maxFileSizeMb = 5,
  onSubmit,
}: CsvUploaderProps<TInsert>) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string | "__ignore" | null>>({});
  const [preview, setPreview] = useState<TInsert[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { showToast } = useToast()

  const steps = useMemo(
    () => [
      {
        title: "Step 1 - CSV Selection",
        description: "Drag & drop or select a CSV file to begin.",
      },
      {
        title: "Step 2 - Data Mapping",
        description: "Map CSV columns to the correct fields.",
      },
      {
        title: "Step 3 - Confirm Mapping",
        description: "Review sample rows before importing.",
      },
    ],
    [],
  );

  const requiredFields = fields.filter((f) => f.required);

  const requiredFieldsMissing = useMemo(
    () =>
      requiredFields.filter((field) => {
        const mappedHeader = mapping[field.key];
        return !mappedHeader || mappedHeader === "__ignore";
      }),
    [mapping, requiredFields],
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > maxFileSizeMb) {
        setError(`File is too large. Maximum size is ${maxFileSizeMb}MB.`);
        return;
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Only CSV files are supported.");
        return;
      }

      const text = await file.text();
      const parsed = basicCsvParse(text);

      if (!parsed.headers.length) {
        setError("Could not find any headers in this CSV file.");
        return;
      }

      setFile(file);
      setCsvHeaders(parsed.headers);
      setCsvRows(parsed.rows);

      // Heuristic auto-mapping: try to match by label or key.
      const initialMapping: Record<string, string | "__ignore" | null> = {};
      for (const field of fields) {
        const candidates = [field.label, field.key].filter(Boolean) as string[];
        const found = parsed.headers.find((h) => {
          const normalizedHeader = h.toLowerCase().replace(/\s+/g, "");
          return candidates.some((c) =>
            normalizedHeader.includes(c.toLowerCase().replace(/\s+/g, "")),
          );
        });

        initialMapping[field.key] = found ?? null;
      }
      setMapping(initialMapping);
      setStep(2);
    },
    [fields, maxFileSizeMb],
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const onFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        void handleFile(file);
      }
    },
    [handleFile],
  );

  const buildPreviewAndValidate = useCallback(() => {
    if (!csvRows.length) return;

    const nonEmptyRows = csvRows.filter((row) => !isRowEmpty(row));
    const mappedRows: TInsert[] = [];
    for (const row of nonEmptyRows.slice(0, 5)) {
      const record: Record<string, unknown> = {};

      for (const field of fields) {
        const mappedHeader = mapping[field.key];
        if (!mappedHeader || mappedHeader === "__ignore") {
          continue;
        }

        const headerIndex = csvHeaders.indexOf(mappedHeader);
        const raw = row[headerIndex] ?? "";

        const parsedValue = field.parse
          ? field.parse(raw)
          : defaultParseByType(field.type, raw);

        if (parsedValue === null || parsedValue === undefined) {
          // For preview we just show null; full validation happens on submit.
          record[field.key] = null;
        } else {
          record[field.key] = parsedValue;
        }
      }

      mappedRows.push(record as TInsert);
    }

    setPreview(mappedRows);
    setStep(3);
  }, [csvHeaders, csvRows, fields, mapping]);

  const handleConfirmAndSubmit = useCallback(async () => {
    setError(null);
    if (!csvRows.length) return;

    // Enforce required mapping UX.
    if (requiredFieldsMissing.length) {
      setError("Please map all required fields before importing.");
      setStep(2);
      return;
    }

    const resultRows: TInsert[] = [];

    for (let rowIndex = 0; rowIndex < csvRows.length; rowIndex++) {
      const row = csvRows[rowIndex];

      // Skip completely empty rows (common when CSV has a trailing newline)
      if (isRowEmpty(row)) {
        continue;
      }

      const record: Record<string, unknown> = {};

      for (const field of fields) {
        const mappedHeader = mapping[field.key];

        if (!mappedHeader || mappedHeader === "__ignore") {
          if (field.required) {
            setError(
              `Row ${rowIndex + 2}: Required field "${field.label ?? field.key}" is not mapped.`,
            );
            setStep(2);
            return;
          }
          continue;
        }

        const headerIndex = csvHeaders.indexOf(mappedHeader);
        const raw = row[headerIndex] ?? "";

        const parsedValue = field.parse
          ? field.parse(raw)
          : defaultParseByType(field.type, raw);

        if ((parsedValue === null || parsedValue === undefined) && field.required) {
          setError(
            `Row ${rowIndex + 2}: Could not parse required field "${field.label ?? field.key}" from value "${raw}".`,
          );
          setStep(3);
          return;
        }

        record[field.key] = parsedValue as any;
      }

      resultRows.push(record as TInsert);
    }

    setIsSubmitting(true);
    try {
      await onSubmit(resultRows);

      showToast({
        title: `${entityName} imported`,
        description: `Successfully imported ${resultRows.length} row${resultRows.length === 1 ? "" : "s"}.`,
        variant: "success",
      });

      setIsSubmitting(false);
      setStep(1);
      setFile(null);
      setCsvHeaders([]);
      setCsvRows([]);
      setMapping({});
      setPreview([]);
    } catch (err) {
      console.error("CSV upload failed", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload data. Please try again.",
      );
      setIsSubmitting(false);
    }
  }, [csvHeaders, csvRows, fields, mapping, onSubmit, requiredFieldsMissing]);

  const dropzoneLabelId = "csv-upload-dropzone-label";

  return (
    <div className="flex flex-col gap-6 m-4 md:flex-row">
      {/* Stepper */}
      <div className="mt-2">
        <CsvStepper currentStep={step} steps={steps} />
      </div>

      <div className="border border-dashed mb-16 border-muted-foreground/40" />

      <div className="flex-1 space-y-6 mt-2">
        {/* Step content */}
        {step === 1 && (
          <section aria-labelledby={dropzoneLabelId} className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragActive(false);
              }}
              onDrop={onDrop}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center transition-colors h-[480px] cursor-pointer",
                dragActive && "border-primary bg-primary/5",
              )}
            >
              <CSVIcon className="mb-6 h-12 w-12 text-muted-foreground" />
              <p id={dropzoneLabelId} className="text-sm font-medium text-foreground">
                Drop CSV here or <span className="text-primary underline">browse files</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Maximum CSV size: {maxFileSizeMb}MB - Maximum files: 1
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onFileInputChange}
              />
            </div>

            {file && (
              <p className="text-xs text-muted-foreground">
                Selected file: <span className="font-medium">{file.name}</span>
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle className="size-4" />
              <span>
                Ensure your first row contains column headers. You can map them in the next step.
              </span>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <h2 className="text-md font-semibold">Map CSV columns to {entityName}</h2>
                <p className="text-xs text-muted-foreground">
                  Required fields must be mapped before you can continue.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setStep(1)}
                className="cursor-pointer"
              >
                Change file
              </Button>
            </div>
            <ScrollArea className="h-[430px] pe-3.5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>CSV column</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field) => {
                    const mappedHeader = mapping[field.key];
                    const isRequiredMissing =
                      field.required && (!mappedHeader || mappedHeader === "__ignore");

                    return (
                      <TableRow key={field.key} className={isRequiredMissing ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-medium">
                              {field.label ?? addSpacesBeforeCapitals(field.key)}
                            </span>
                            {field.description && (
                              <span className="text-xs text-muted-foreground">
                                {field.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs uppercase text-muted-foreground">
                          {field.type}
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Badge variant="destructive">Required</Badge>
                          ) : (
                            <Badge variant="outline">Optional</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Select
                              value={mappedHeader ?? ""}
                              onValueChange={(value) => {
                                setMapping((prev) => ({
                                  ...prev,
                                  [field.key]: value,
                                }));
                              }}
                            >
                              <SelectTrigger size="sm" className="min-w-[180px]">
                                <SelectValue placeholder="Select a column or ignore" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__ignore">Ignore column</SelectItem>
                                {csvHeaders.map((header) => (
                                  <SelectItem key={header} value={header}>
                                    {header}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isRequiredMissing && (
                              <span className="flex items-center gap-1 text-[11px] text-destructive">
                                <AlertCircle className="size-3" />
                                Required field must be mapped
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-muted-foreground">
                {requiredFieldsMissing.length > 0 && (
                  <>
                    <span className="font-medium text-destructive">
                      {requiredFieldsMissing.length} required field
                      {requiredFieldsMissing.length > 1 ? "s" : ""} missing mapping.
                    </span>{" "}
                    Please map them to continue.
                  </>
                )}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setStep(1)}
                  className="cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  type="button"
                  disabled={requiredFieldsMissing.length > 0}
                  onClick={buildPreviewAndValidate}
                  className="cursor-pointer"
                >
                  Continue
                </Button>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">Confirm mapping</h2>
              <p className="text-xs text-muted-foreground">
                Review how the first 5 rows will be imported into {entityName}.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-medium">Mapped fields</h3>
              <div className="flex flex-wrap gap-1">
                {fields.map((field) => {
                  const mappedHeader = mapping[field.key];
                  if (!mappedHeader || mappedHeader === "__ignore") return null;

                  return (
                    <Badge key={field.key} variant="outline">
                      {field.label ?? addSpacesBeforeCapitals(field.key)} - <span className="text-muted-foreground">{mappedHeader}</span>
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">Sample rows</span>
                <span className="text-muted-foreground">
                  Showing up to 5 of {csvRows.length} row{csvRows.length === 1 ? "" : "s"}
                </span>
              </div>

              {isSubmitting && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>
                    Uploading {csvRows.length} row{csvRows.length === 1 ? "" : "s"}...
                  </span>
                </div>
              )}
              <ScrollArea className="h-[250px] w-[890px] pe-3.5">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fields.map((field) => (
                        <TableHead key={field.key}>
                          {field.label ?? addSpacesBeforeCapitals(field.key)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={fields.length} className="text-center text-xs text-muted-foreground">
                          No preview available.
                        </TableCell>
                      </TableRow>
                    )}
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        {fields.map((field) => (
                          <TableCell key={field.key} className="text-xs">
                            {String((row as any)[field.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>
                    Data will be saved after you confirm.
                  </TableCaption>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="flex items-center justify-between pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setStep(2)}
                  className="cursor-pointer"
                >
                  Back to mapping
                </Button>
                <Button
                  size="sm"
                  type="button"
                  onClick={handleConfirmAndSubmit}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  {isSubmitting ? "Uploading..." : "Confirm & Upload"}
                </Button>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-4" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
