"use client"

import { useMemo, useState, useTransition } from "react"
import Papa from "papaparse"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type CsvRow = Record<string, string>

type DbField =
  | "name"
  | "business_type"
  | "phone"
  | "instagram"
  | "contact_method"
  | "location"
  | "company_size"
  | "status"

type MappingValue = DbField | "skip"

type MappingState = Record<string, MappingValue>

type CompaniesImportPayload = {
  name: string
  business_type: string
  phone: string
  instagram: string
  contact_method: string
  location: string
  company_size: string
  status: string
}

type ImportSkipReason =
  | "missing_required_fields"
  | "invalid_phone"
  | "duplicate_phone"
  | "duplicate_instagram"
  | "duplicate_name"

type ImportApiSuccess = {
  inserted: number
  skipped: number
  skippedByReason?: Partial<Record<ImportSkipReason, number>>
}

const SKIP_REASON_LABELS: Record<ImportSkipReason, string> = {
  missing_required_fields: "faltan campos obligatorios",
  invalid_phone: "teléfono inválido",
  duplicate_phone: "número ya existente",
  duplicate_instagram: "Instagram ya existente",
  duplicate_name: "nombre ya existente",
}

function buildSkipReasonsMessage(skippedByReason?: Partial<Record<ImportSkipReason, number>>) {
  if (!skippedByReason) {
    return ""
  }

  const parts = Object.entries(skippedByReason)
    .filter(([, count]) => Boolean(count))
    .map(([reason, count]) => {
      const label = SKIP_REASON_LABELS[reason as ImportSkipReason]
      return `${count} por ${label}`
    })

  return parts.length > 0 ? parts.join(" · ") : ""
}

const DATABASE_FIELDS: Array<{ value: DbField; label: string; required?: boolean }> = [
  { value: "name", label: "nombre", required: true },
  { value: "business_type", label: "tipo_negocio" },
  { value: "phone", label: "telefono" },
  { value: "instagram", label: "instagram" },
  { value: "contact_method", label: "metodo_contacto" },
  { value: "location", label: "ubicacion" },
  { value: "company_size", label: "tamano_empresa" },
  { value: "status", label: "estado" },
]

const REQUIRED_FIELDS: DbField[] = ["name"]

const FIELD_SUGGESTIONS: Record<DbField, string[]> = {
  name: ["name", "nombre", "empresa", "company", "nombre de la empresa"],
  business_type: ["business type", "tipo negocio", "tipo de negocio", "business"],
  phone: [
    "phone",
    "telefono",
    "tel",
    "teléfono",
    "contact",
    "whatsapp",
    "whatsapp phone",
    "whatsapp_phone",
    "wa",
    "wa phone",
  ],
  instagram: ["instagram", "instagram user", "instagram_user", "ig", "ig user"],
  contact_method: [
    "contact method",
    "contact_method",
    "metodo contacto",
    "método contacto",
  ],
  location: ["location", "ubicacion", "ubicación", "city", "direccion"],
  company_size: ["company size", "tipo empresa", "tipo de empresa", "size"],
  status: ["status", "estado"],
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()
}

function suggestMapping(header: string): MappingValue {
  const normalizedHeader = normalize(header)

  for (const [field, terms] of Object.entries(FIELD_SUGGESTIONS) as Array<
    [DbField, string[]]
  >) {
    if (terms.some((term) => normalizedHeader.includes(normalize(term)))) {
      return field
    }
  }

  return "skip"
}

function buildInitialMapping(headers: string[]): MappingState {
  const used = new Set<DbField>()
  const mapping: MappingState = {}

  for (const header of headers) {
    const suggestion = suggestMapping(header)

    if (suggestion !== "skip" && !used.has(suggestion)) {
      mapping[header] = suggestion
      used.add(suggestion)
    } else {
      mapping[header] = "skip"
    }
  }

  return mapping
}

function buildPayload(rows: CsvRow[], mapping: MappingState): CompaniesImportPayload[] {
  return rows.map((row) => {
    const output: CompaniesImportPayload = {
      name: "",
      business_type: "",
      phone: "",
      instagram: "",
      contact_method: "",
      location: "",
      company_size: "",
      status: "lead",
    }

    for (const [header, target] of Object.entries(mapping)) {
      if (target === "skip") {
        continue
      }

      output[target] = String(row[header] ?? "").trim()
    }

    return output
  })
}

function validateMapping(mapping: MappingState): string[] {
  const errors: string[] = []
  const assigned = Object.values(mapping).filter((value) => value !== "skip") as DbField[]

  for (const requiredField of REQUIRED_FIELDS) {
    if (!assigned.includes(requiredField)) {
      errors.push(`Debes mapear el campo obligatorio: ${requiredField}`)
    }
  }

  const counts = new Map<DbField, number>()
  for (const field of assigned) {
    counts.set(field, (counts.get(field) ?? 0) + 1)
  }

  for (const requiredField of REQUIRED_FIELDS) {
    if ((counts.get(requiredField) ?? 0) > 1) {
      errors.push(`No puedes mapear dos columnas al campo obligatorio: ${requiredField}`)
    }
  }

  return errors
}

export function ProspectsImportDialog() {
  const [open, setOpen] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<CsvRow[]>([])
  const [mapping, setMapping] = useState<MappingState>({})
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState("")
  const [isParsing, startParsing] = useTransition()
  const [isImporting, startImporting] = useTransition()

  const previewRows = useMemo(() => rows.slice(0, 10), [rows])
  const progressValue = step === 1 ? 33 : step === 2 ? 66 : 100

  const resetState = () => {
    setHeaders([])
    setRows([])
    setMapping({})
    setStep(1)
    setError("")
  }

  const handleCsvUpload = (file: File | undefined) => {
    if (!file) {
      return
    }

    startParsing(async () => {
      setError("")

      try {
        const content = await file.text()
        const result = Papa.parse<CsvRow>(content, {
          header: true,
          skipEmptyLines: true,
        })

        if (result.errors.length > 0) {
          setError(result.errors[0]?.message ?? "Error leyendo CSV")
          return
        }

        const parsedRows = result.data
        const parsedHeaders = (result.meta.fields ?? []).filter(Boolean)

        if (parsedHeaders.length === 0 || parsedRows.length === 0) {
          setError("El CSV no tiene encabezados o filas válidas.")
          return
        }

        setHeaders(parsedHeaders)
        setRows(parsedRows)
        setMapping(buildInitialMapping(parsedHeaders))
        setStep(2)
      } catch {
        setError("No se pudo procesar el archivo CSV.")
      }
    })
  }

  const mappingErrors = useMemo(() => validateMapping(mapping), [mapping])

  const canContinueToImport = headers.length > 0 && rows.length > 0 && mappingErrors.length === 0

  const handleImport = () => {
    startImporting(async () => {
      setError("")

      const payload = buildPayload(rows, mapping)

      const response = await fetch("/api/companies/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = (await response.json()) as ImportApiSuccess | { error: string }

      if (!response.ok) {
        const message = "error" in data ? data.error : "No se pudo importar."
        setError(message)
        toast.error(message)
        return
      }

      const inserted = "inserted" in data ? data.inserted : 0
      const skipped = "skipped" in data ? data.skipped : 0
      const skipReasons = "skippedByReason" in data
        ? buildSkipReasonsMessage(data.skippedByReason)
        : ""

      const summary = `Importación completada. Insertados: ${inserted}, omitidos: ${skipped}.`

      if (skipped > 0 && skipReasons) {
        toast.warning(`${summary} Motivos: ${skipReasons}.`)
      } else {
        toast.success(summary)
      }
      setStep(3)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          resetState()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Importar</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Importar CSV (3 pasos)</DialogTitle>
          <DialogDescription>
            1) Subir CSV · 2) Mapear columnas · 3) Importar datos
          </DialogDescription>
        </DialogHeader>

        <Progress value={progressValue} className="h-2" />

        {step === 1 ? (
          <div className="grid gap-3">
            <Input
              type="file"
              accept=".csv"
              onChange={(event) => handleCsvUpload(event.target.files?.[0])}
            />
            <p className="text-sm text-muted-foreground">Solo se aceptan archivos .csv</p>
            {isParsing ? <p className="text-sm">Procesando CSV...</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {step >= 2 ? (
          <div className="grid gap-4">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((row, index) => (
                    <TableRow key={`preview-${index}`}>
                      {headers.map((header) => (
                        <TableCell key={`${header}-${index}`}>{row[header]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2">
              {headers.map((header) => (
                <div key={header} className="grid gap-1 sm:grid-cols-2 sm:items-center">
                  <p className="text-sm font-medium">{header}</p>
                  <Select
                    value={mapping[header] ?? "skip"}
                    onValueChange={(value) => {
                      setMapping((current) => ({
                        ...current,
                        [header]: value as MappingValue,
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {DATABASE_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                          {field.required ? " (obligatorio)" : ""}
                        </SelectItem>
                      ))}
                      <SelectItem value="skip">No importar esta columna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {DATABASE_FIELDS.map((field) => (
                <Badge key={field.value} variant="secondary">
                  {field.label}
                </Badge>
              ))}
            </div>

            {mappingErrors.length > 0 ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {mappingErrors.map((mappingError) => (
                  <p key={mappingError}>{mappingError}</p>
                ))}
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="rounded-md border border-chart-2/30 bg-chart-2/10 p-3 text-sm text-chart-2">
            Importación finalizada correctamente.
          </div>
        ) : null}

        <DialogFooter>
          {step === 2 ? (
            <Button onClick={handleImport} disabled={!canContinueToImport || isImporting}>
              {isImporting ? "Importando..." : "Importar datos"}
            </Button>
          ) : null}

          {step === 3 ? (
            <Button
              onClick={() => {
                setOpen(false)
                resetState()
              }}
            >
              Cerrar
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
