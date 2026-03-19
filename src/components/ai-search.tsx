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
  const [businessType, setBusinessType] = useState("")
  const [location, setLocation] = useState("")
  const [keywords, setKeywords] = useState("")
  const [results, setResults] = useState<AIProspectResult[]>([])
  const [importedIndexes, setImportedIndexes] = useState<Set<number>>(new Set())
  const [isSearching, startSearch] = useTransition()
  const [importingIndex, setImportingIndex] = useState<number | null>(null)

  function handleSearch() {
    if (!businessType.trim() || !location.trim()) {
      toast.error("Tipo de negocio y ubicación son requeridos")
      return
    }

    startSearch(async () => {
      const result = await searchProspectsWithAI({
        businessType: businessType.trim(),
        location: location.trim(),
        keywords: keywords.trim() || undefined,
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
          <CardTitle className="text-base">Criterios de Búsqueda</CardTitle>
          <CardDescription>
            Define el tipo de negocio y la zona para buscar prospectos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="businessType">Tipo de Negocio *</Label>
              <Input
                id="businessType"
                placeholder="Ej: Restaurante, Taller, Clínica..."
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación / Zona *</Label>
              <Input
                id="location"
                placeholder="Ej: Santo Domingo, Piantini..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keywords">Palabras Clave (opcional)</Label>
              <Input
                id="keywords"
                placeholder="Ej: premium, delivery, nuevo..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
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
            {isSearching ? "Buscando..." : "Buscar Prospectos"}
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
