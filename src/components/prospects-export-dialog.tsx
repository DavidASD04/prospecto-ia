"use client"

import { useMemo, useState, useTransition } from "react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { PDFDocument, StandardFonts } from "pdf-lib"
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
import type { Prospect } from "@/types/prospect"

type ExportFormat = "csv" | "xlsx" | "pdf"

type ProspectsExportDialogProps = {
  prospects: Prospect[]
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export function ProspectsExportDialog({ prospects }: ProspectsExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [open, setOpen] = useState(false)
  const [isExporting, startExporting] = useTransition()

  const exportRows = useMemo(
    () =>
      prospects.map((prospect) => ({
        Nombre: prospect.name,
        "Tipo de Negocio": prospect.businessType,
        Teléfono: prospect.phone,
        WhatsApp: prospect.phone,
        Instagram: prospect.instagram ?? "",
        "Método de contacto": prospect.contactMethod,
        Ubicación: prospect.location,
        "Tipo de Empresa": prospect.companyType,
        Contactado: prospect.contacted ? "Sí" : "No",
      })),
    [prospects]
  )

  const handleExport = () => {
    startExporting(async () => {
      const baseFileName = `prospectos-${new Date().toISOString().slice(0, 10)}`

      if (format === "csv") {
        const csv = Papa.unparse(exportRows)
        downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `${baseFileName}.csv`)
        setOpen(false)
        return
      }

      if (format === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(exportRows)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Prospectos")
        const output = XLSX.write(workbook, { type: "array", bookType: "xlsx" })
        downloadBlob(
          new Blob([output], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          }),
          `${baseFileName}.xlsx`
        )
        setOpen(false)
        return
      }

      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([842, 595])
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

      page.drawText("Exportación de Posibles Clientes", {
        x: 40,
        y: 560,
        size: 14,
        font,
      })

      let y = 540
      for (const row of exportRows) {
        const line = `${row.Nombre} | ${row["Tipo de Negocio"]} | ${row.Teléfono} | ${row["Ubicación"]} | ${row["Tipo de Empresa"]} | ${row.Contactado}`

        page.drawText(line.slice(0, 120), {
          x: 40,
          y,
          size: 9,
          font,
        })

        y -= 14

        if (y < 40) {
          break
        }
      }

      const bytes = await pdfDoc.save()
      const safeBytes = new Uint8Array(bytes.length)
      safeBytes.set(bytes)
      const pdfBuffer = safeBytes.buffer
      downloadBlob(new Blob([pdfBuffer], { type: "application/pdf" }), `${baseFileName}.pdf`)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Exportar</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Exportar Posibles Clientes</DialogTitle>
          <DialogDescription>
            Exporta los resultados filtrados actuales en CSV, Excel o PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="w-full sm:w-64">
            <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo de Negocio</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Método de contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Tipo de Empresa</TableHead>
                  <TableHead>Contactado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                      No hay datos para exportar.
                    </TableCell>
                  </TableRow>
                ) : (
                  exportRows.map((row, index) => (
                    <TableRow key={`${row.Nombre}-${index}`}>
                      <TableCell>{row.Nombre}</TableCell>
                      <TableCell>{row["Tipo de Negocio"]}</TableCell>
                      <TableCell>{row.Teléfono}</TableCell>
                      <TableCell>{row.WhatsApp}</TableCell>
                      <TableCell>{row.Instagram}</TableCell>
                      <TableCell>{row["Método de contacto"]}</TableCell>
                      <TableCell>{row["Ubicación"]}</TableCell>
                      <TableCell>{row["Tipo de Empresa"]}</TableCell>
                      <TableCell>{row.Contactado}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={isExporting || exportRows.length === 0}>
            {isExporting ? "Exportando..." : "Confirmar descarga"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
