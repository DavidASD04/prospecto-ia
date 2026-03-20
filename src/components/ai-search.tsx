"use client"

import { useState, useTransition } from "react"
import { BrainCircuit, Download, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

import { searchProspectsWithAI, importAIProspect } from "@/app/actions"
import type { AIProspectResult } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export function AISearch() {
  const [serviceOffered, setServiceOffered] = useState("")
  const [targetBusinesses, setTargetBusinesses] = useState("")
  const [location, setLocation] = useState("")
  const [results, setResults] = useState<AIProspectResult[]>([])
  const [importedIndexes, setImportedIndexes] = useState<Set<number>>(new Set())
  const [isSearching, startSearch] = useTransition()
  const [importingIndex, setImportingIndex] = useState<number | null>(null)

  function handleSearch() {
    if (!serviceOffered.trim() || !targetBusinesses.trim() || !location.trim()) {
      toast.error("Todos los campos son requeridos")
      return
    }

    startSearch(async () => {
      const result = await searchProspectsWithAI({
        serviceOffered: serviceOffered.trim(),
        targetBusinesses: targetBusinesses.trim(),
        location: location.trim(),
      })

      if (result.success && result.prospects) {
        setResults(result.prospects)
        setImportedIndexes(new Set())
        toast.success(`Se encontraron ${result.prospects.length} prospectos`)
      } else {
        toast.error(result.error || "Error en la búsqueda")
      }
    })
  }

  async function handleImport(prospect: AIProspectResult, index: number) {
    setImportingIndex(index)
    try {
      const result = await importAIProspect(prospect)
      if (result.success) {
        setImportedIndexes((prev) => new Set(prev).add(index))
        toast.success(`"${prospect.name}" importado exitosamente`)
      } else {
        toast.error(result.error || "Error importando prospecto")
      }
    } finally {
      setImportingIndex(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <BrainCircuit className="size-7 text-primary" />
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Buscador IA</h1>
          <p className="text-sm text-muted-foreground">
            Encuentra prospectos potenciales usando inteligencia artificial
          </p>
        </div>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar Prospectos con IA</CardTitle>
          <CardDescription>
            Describe tu servicio y el tipo de negocios que buscas. La IA generará prospectos ideales para ti.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="serviceOffered">¿Qué vendes o qué servicio ofreces? *</Label>
              <Textarea
                id="serviceOffered"
                placeholder="Ej: Sistema de facturación electrónica, Servicio de diseño web, Software de gestión de inventario, Marketing digital..."
                value={serviceOffered}
                onChange={(e) => setServiceOffered(e.target.value)}
                disabled={isSearching}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetBusinesses">¿A qué tipo de negocios quieres venderle? *</Label>
              <Input
                id="targetBusinesses"
                placeholder="Ej: Restaurantes, Clínicas dentales, Talleres mecánicos..."
                value={targetBusinesses}
                onChange={(e) => setTargetBusinesses(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación / Zona *</Label>
              <Input
                id="location"
                placeholder="Ej: Santo Domingo, Piantini, Santiago..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSearching}
              />
            </div>
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="mt-4 w-full sm:w-auto"
          >
            {isSearching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            {isSearching ? "Buscando prospectos..." : "Buscar Prospectos"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Resultados ({results.length} prospectos encontrados)
            </CardTitle>
            <CardDescription>
              Importa los prospectos que te interesen a tu lista de Posibles Clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Tipo</TableHead>
                    <TableHead className="hidden lg:table-cell">Teléfono</TableHead>
                    <TableHead className="hidden lg:table-cell">Instagram</TableHead>
                    <TableHead className="hidden sm:table-cell">Ubicación</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((prospect, index) => {
                    const isImported = importedIndexes.has(index)
                    const isImporting = importingIndex === index

                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{prospect.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary">{prospect.businessType}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {prospect.phone || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {prospect.instagram ? `@${prospect.instagram}` : "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {prospect.location}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {prospect.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {isImported ? (
                            <Badge variant="default">Importado</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImport(prospect, index)}
                              disabled={isImporting}
                            >
                              {isImporting ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Download className="size-3" />
                              )}
                              <span className="hidden sm:inline">Importar</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
