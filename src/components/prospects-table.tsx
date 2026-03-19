"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { deleteMultipleDealers, updateDealerContacted } from "@/app/actions"
import { ProspectDetailDialog } from "@/components/prospect-detail-dialog"
import { ProspectForm } from "@/components/prospect-form"
import { ProspectsExportDialog } from "@/components/prospects-export-dialog"
import { ProspectsImportDialog } from "@/components/prospects-import-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { MessageTemplate } from "@/types/message-template"
import type { Prospect } from "@/types/prospect"
import { Instagram, MessageCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AutoRefresh } from "./auto-refresh"

type StatusFilterMode = "all" | "contacted" | "not-contacted"
type ActivityFilterMode = "active" | "inactive" | "all"
type ContactFilterMode =
  | "all"
  | "has-whatsapp"
  | "has-instagram"
  | "has-both"
  | "no-contact"

type ProspectsTableProps = {
  prospects: Prospect[]
  templates: MessageTemplate[]
}

function getWhatsAppUrl(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

function openOrReuseWhatsAppTab(url: string) {
  const whatsappTab = window.open("", "crm-whatsapp-tab")

  if (!whatsappTab) {
    window.open(url, "_blank")
    return
  }

  whatsappTab.location.href = url
  whatsappTab.focus()
}

function openWhatsAppWithFallback(phone: string) {
  const webUrl = getWhatsAppUrl(phone)
  openOrReuseWhatsAppTab(webUrl)
}

function getInstagramUrl(handle: string) {
  return `https://instagram.com/${handle}`
}

export function ProspectsTable({ prospects, templates }: ProspectsTableProps) {
  const router = useRouter()
  const [activityFilterMode, setActivityFilterMode] = useState<ActivityFilterMode>("active")
  const [statusFilterMode, setStatusFilterMode] = useState<StatusFilterMode>("all")
  const [contactFilterMode, setContactFilterMode] = useState<ContactFilterMode>("all")
  const [search, setSearch] = useState("")
  const [isUpdating, startUpdating] = useTransition()
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDeleting, startDeleting] = useTransition()

  const filteredProspects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return prospects.filter((prospect) => {
      const hasWhatsapp = Boolean(prospect.phone)
      const hasInstagram = Boolean(prospect.instagram)

      const matchesActivityFilter =
        activityFilterMode === "all" ||
        (activityFilterMode === "active" && prospect.isActive) ||
        (activityFilterMode === "inactive" && !prospect.isActive)

      const matchesStatusFilter =
        statusFilterMode === "all" ||
        (statusFilterMode === "contacted" && prospect.contacted) ||
        (statusFilterMode === "not-contacted" && !prospect.contacted)

      const matchesContactFilter =
        contactFilterMode === "all" ||
        (contactFilterMode === "has-whatsapp" && hasWhatsapp) ||
        (contactFilterMode === "has-instagram" && hasInstagram) ||
        (contactFilterMode === "has-both" && hasWhatsapp && hasInstagram) ||
        (contactFilterMode === "no-contact" && !hasWhatsapp && !hasInstagram)

      const matchesSearch =
        normalizedSearch.length === 0 || prospect.name.toLowerCase().includes(normalizedSearch)

      return (
        matchesActivityFilter && matchesStatusFilter && matchesContactFilter && matchesSearch
      )
    })
  }, [activityFilterMode, contactFilterMode, prospects, search, statusFilterMode])

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProspects.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProspects.map((prospect) => prospect.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)

    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }

    setSelectedIds(newSelected)
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      return
    }

    const shouldDelete = window.confirm(
      `¿Estás seguro de descartar ${selectedIds.size} prospecto(s)? Pasarán a inactivos.`
    )

    if (!shouldDelete) {
      return
    }

    startDeleting(async () => {
      const result = await deleteMultipleDealers(Array.from(selectedIds))

      if (!result.success) {
        toast.error(result.error || "Error al eliminar")
        return
      }

      toast.success(`${selectedIds.size} prospecto(s) marcado(s) como inactivos`)
      setSelectedIds(new Set())
      router.refresh()
    })
  }

  const statusFilterButtonStyle = (mode: StatusFilterMode) =>
    mode === statusFilterMode ? "default" : "outline"

  const selectedProspectsData = useMemo(
    () => prospects.filter((prospect) => selectedIds.has(prospect.id)),
    [prospects, selectedIds]
  )

  return (
    <div className="mx-auto flex min-w-0 w-full max-w-7xl flex-col gap-4 overflow-x-hidden p-3 sm:gap-6 sm:p-4 md:p-6">
      <AutoRefresh interval={5000} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Posibles Clientes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Gestiona prospectos que podrían contratar tu ERP.
          </p>
        </div>

        {selectedIds.size > 0 ? (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-2 md:w-auto md:justify-end">
            <span className="px-2 text-sm font-medium">{selectedIds.size} seleccionados</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Descartar
            </Button>
            <ProspectsExportDialog prospects={selectedProspectsData} />
            <Button variant="outline" size="sm" onClick={() => setSelectedIds(new Set())}>
              Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex w-full flex-wrap items-center gap-2 sm:justify-end md:w-auto md:justify-end">
            <ProspectsImportDialog />
            <ProspectsExportDialog prospects={filteredProspects} />
            <ProspectForm />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:overflow-visible md:pb-0">
          <Button
            className="shrink-0"
            variant={statusFilterButtonStyle("all")}
            onClick={() => setStatusFilterMode("all")}
          >
            Todos
          </Button>
          <Button
            className="shrink-0"
            variant={statusFilterButtonStyle("contacted")}
            onClick={() => setStatusFilterMode("contacted")}
          >
            Contactados
          </Button>
          <Button
            className="shrink-0"
            variant={statusFilterButtonStyle("not-contacted")}
            onClick={() => setStatusFilterMode("not-contacted")}
          >
            Pendientes
          </Button>
        </div>

        <div className="grid w-full gap-2 sm:gap-3 lg:grid-cols-[220px_220px_minmax(220px,1fr)] lg:items-center">
          <Select
            value={activityFilterMode}
            onValueChange={(value) => setActivityFilterMode(value as ActivityFilterMode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Vista: Activos</SelectItem>
              <SelectItem value="inactive">Vista: Inactivos</SelectItem>
              <SelectItem value="all">Vista: Todos</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={contactFilterMode}
            onValueChange={(value) => setContactFilterMode(value as ContactFilterMode)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Filter by: Todos</SelectItem>
              <SelectItem value="has-whatsapp">Has WhatsApp</SelectItem>
              <SelectItem value="has-instagram">Has Instagram</SelectItem>
              <SelectItem value="has-both">Has Both</SelectItem>
              <SelectItem value="no-contact">No Contact Method</SelectItem>
            </SelectContent>
          </Select>

          <Input
            className="w-full"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre"
          />
        </div>
      </div>

      <div className="grid gap-3 md:hidden">
        {filteredProspects.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay prospectos que coincidan con los filtros.
            </CardContent>
          </Card>
        ) : (
          filteredProspects.map((prospect) => {
            const hasWhatsapp = Boolean(prospect.phone)
            const hasInstagram = Boolean(prospect.instagram)
            const isInactive = !prospect.isActive

            return (
              <Card key={prospect.id} className={selectedIds.has(prospect.id) ? "border-primary" : undefined}>
                <CardContent className="grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium leading-tight">{prospect.name}</p>
                      <p className="text-sm text-muted-foreground">{prospect.businessType}</p>
                    </div>

                    <Checkbox
                      checked={selectedIds.has(prospect.id)}
                      onCheckedChange={() => toggleSelect(prospect.id)}
                      aria-label={`Seleccionar ${prospect.name}`}
                    />
                  </div>

                  <div className="grid gap-1 text-sm">
                    <p><span className="text-muted-foreground">WhatsApp:</span> {prospect.phone || "-"}</p>
                    <p><span className="text-muted-foreground">Instagram:</span> {prospect.instagram ? `@${prospect.instagram}` : "-"}</p>
                    <p><span className="text-muted-foreground">Ubicación:</span> {prospect.location || "-"}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={prospect.contacted}
                      disabled={isUpdating || isInactive}
                      onCheckedChange={(checked) => {
                        startUpdating(async () => {
                          const result = await updateDealerContacted(
                            prospect.id,
                            checked === true
                          )

                          if (result.success) {
                            router.refresh()
                          }
                        })
                      }}
                      aria-label={`Marcar ${prospect.name} como contactado`}
                    />

                    {isInactive ? (
                      <Badge variant="secondary">Inactivo</Badge>
                    ) : prospect.contacted ? (
                      <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                        Contactado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {hasWhatsapp && !isInactive ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openWhatsAppWithFallback(prospect.phone)}
                      >
                        <MessageCircle className="mr-1 h-4 w-4 text-chart-2" />
                        WhatsApp
                      </Button>
                    ) : null}

                    {hasInstagram && !isInactive ? (
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={getInstagramUrl(prospect.instagram!)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Instagram className="mr-1 h-4 w-4 text-chart-5" />
                          Instagram
                        </a>
                      </Button>
                    ) : null}

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setSelectedProspect(prospect)
                        setIsDetailOpen(true)
                      }}
                    >
                      Ver detalle
                    </Button>

                    {isInactive ? (
                      <Badge variant="secondary">Sin acciones (inactivo)</Badge>
                    ) : (!hasWhatsapp && !hasInstagram) ? (
                      <Badge variant="secondary">No contact method</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <div className="hidden min-w-0 w-full max-w-full overflow-x-auto rounded-xl border bg-card shadow-sm md:block">
        <TooltipProvider>
          <Table className="min-w-[980px] lg:min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12.5">
                  <Checkbox
                    checked={
                      filteredProspects.length > 0 &&
                      selectedIds.size === filteredProspects.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead className="whitespace-nowrap">Nombre</TableHead>
                <TableHead className="hidden whitespace-nowrap lg:table-cell">Tipo de negocio</TableHead>
                <TableHead className="hidden whitespace-nowrap xl:table-cell">Phone</TableHead>
                <TableHead className="whitespace-nowrap">WhatsApp</TableHead>
                <TableHead className="whitespace-nowrap">Instagram</TableHead>
                <TableHead className="hidden whitespace-nowrap lg:table-cell">Ubicación</TableHead>
                <TableHead className="hidden whitespace-nowrap xl:table-cell">Tipo de empresa</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
                    No hay prospectos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((prospect) => {
                  const hasWhatsapp = Boolean(prospect.phone)
                  const hasInstagram = Boolean(prospect.instagram)
                  const isInactive = !prospect.isActive

                  return (
                    <TableRow
                      key={prospect.id}
                      className={`cursor-pointer ${selectedIds.has(prospect.id) ? "bg-muted/50" : ""} ${isInactive ? "opacity-70" : ""}`}
                      onDoubleClick={() => {
                        setSelectedProspect(prospect)
                        setIsDetailOpen(true)
                      }}
                    >
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(prospect.id)}
                          onCheckedChange={() => toggleSelect(prospect.id)}
                          aria-label={`Seleccionar ${prospect.name}`}
                        />
                      </TableCell>
                      <TableCell className="max-w-44 truncate">{prospect.name}</TableCell>
                      <TableCell className="hidden max-w-44 truncate lg:table-cell">{prospect.businessType}</TableCell>
                      <TableCell className="hidden xl:table-cell">{prospect.phone}</TableCell>
                      <TableCell className="max-w-40 truncate">{prospect.phone}</TableCell>
                      <TableCell>{prospect.instagram ? `@${prospect.instagram}` : "-"}</TableCell>
                      <TableCell className="hidden max-w-44 truncate lg:table-cell">{prospect.location}</TableCell>
                      <TableCell className="hidden max-w-44 truncate xl:table-cell">{prospect.companyType}</TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={prospect.contacted}
                            disabled={isUpdating || isInactive}
                            onCheckedChange={(checked) => {
                              startUpdating(async () => {
                                const result = await updateDealerContacted(
                                  prospect.id,
                                  checked === true
                                )

                                if (result.success) {
                                  router.refresh()
                                }
                              })
                            }}
                            aria-label={`Marcar ${prospect.name} como contactado`}
                          />
                          {isInactive ? (
                            <Badge variant="secondary">Inactivo</Badge>
                          ) : prospect.contacted ? (
                            <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                              Contactado
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pendiente</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-2">
                          {hasWhatsapp && !isInactive ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 hover:bg-chart-2/10"
                                  asChild
                                >
                                  <a
                                    href={getWhatsAppUrl(prospect.phone)}
                                    onClick={(event) => {
                                      event.preventDefault()
                                      openWhatsAppWithFallback(prospect.phone)
                                    }}
                                    target="crm-whatsapp-tab"
                                  >
                                    <MessageCircle className="h-4 w-4 text-chart-2" />
                                    <span className="sr-only">Open WhatsApp</span>
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open WhatsApp</TooltipContent>
                            </Tooltip>
                          ) : null}

                          {hasInstagram && !isInactive ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-9 w-9 hover:bg-chart-5/10"
                                  asChild
                                >
                                  <a
                                    href={getInstagramUrl(prospect.instagram!)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Instagram className="h-4 w-4 text-chart-5" />
                                    <span className="sr-only">Open Instagram</span>
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Open Instagram</TooltipContent>
                            </Tooltip>
                          ) : null}

                          {isInactive ? (
                            <Badge variant="secondary">Sin acciones (inactivo)</Badge>
                          ) : (!hasWhatsapp && !hasInstagram) ? (
                            <Badge variant="secondary">No contact method</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </div>

      <p className="text-sm text-muted-foreground">
        Doble click sobre un prospecto para ver detalle, editar, contactar o eliminar.
      </p>

      <ProspectDetailDialog
        prospect={selectedProspect}
        templates={templates}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  )
}
