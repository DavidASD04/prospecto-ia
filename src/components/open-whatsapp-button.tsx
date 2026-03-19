"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { updateDealerStatusForWhatsApp } from "@/app/actions"
import { renderMessageTemplate } from "@/lib/message-template"
import type { MessageTemplate } from "@/types/message-template"
import type { Prospect } from "@/types/prospect"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type OpenWhatsAppButtonProps = {
  prospect: Prospect
  templates: Array<Pick<MessageTemplate, "id" | "name" | "messageTemplate">>
}

type StatusChoice = "no-change" | "contacted" | "pending"

function getWhatsAppUrl(phone: string, message?: string) {
  const normalizedPhone = phone.replace(/\D/g, "")

  if (!message?.trim()) {
    return `https://wa.me/${normalizedPhone}`
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`
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

function openWhatsAppWithFallback(phone: string, message?: string) {
  const webUrl = getWhatsAppUrl(phone, message)
  openOrReuseWhatsAppTab(webUrl)
}

export function OpenWhatsAppButton({ prospect, templates }: OpenWhatsAppButtonProps) {
  const router = useRouter()
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [statusChoice, setStatusChoice] = useState<StatusChoice>("no-change")
  const [preparedMessage, setPreparedMessage] = useState("")
  const [isSubmitting, startSubmitting] = useTransition()

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates]
  )

  function closeAllDialogs() {
    setIsTemplateDialogOpen(false)
    setIsStatusDialogOpen(false)
    setSelectedTemplateId("")
    setPreparedMessage("")
    setStatusChoice("no-change")
  }

  function prepareTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId)

    if (!template) {
      toast.error("Plantilla no encontrada.")
      return
    }

    const finalMessage = renderMessageTemplate(template.messageTemplate, prospect)

    if (!finalMessage.trim()) {
      toast.error("La plantilla generó un mensaje vacío.")
      return
    }

    setSelectedTemplateId(template.id)
    setPreparedMessage(finalMessage)
    setIsTemplateDialogOpen(false)
    setIsStatusDialogOpen(true)
  }

  function startFlow() {
    if (templates.length === 0) {
      toast.error("No hay plantillas disponibles. Crea una en Plantillas.")
      return
    }

    if (templates.length === 1) {
      prepareTemplate(templates[0].id)
      return
    }

    setSelectedTemplateId(templates[0].id)
    setIsTemplateDialogOpen(true)
  }

  function handleConfirmStatusAndOpen() {
    startSubmitting(async () => {
      if (!prospect.phone) {
        toast.error("Este prospecto no tiene WhatsApp configurado.")
        return
      }

      if (statusChoice !== "no-change") {
        const response = await updateDealerStatusForWhatsApp({
          dealerId: prospect.id,
          status: statusChoice,
        })

        if (!response.success) {
          toast.error(response.error ?? "No se pudo actualizar el estado.")
          return
        }

        router.refresh()
      }

      openWhatsAppWithFallback(prospect.phone, preparedMessage)
      closeAllDialogs()
    })
  }

  return (
    <>
      <Button variant="outline" onClick={startFlow}>
        Enviar WhatsApp
      </Button>

      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Selecciona una plantilla</DialogTitle>
            <DialogDescription>
              Elige la plantilla para generar el mensaje personalizado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {templates.map((template) => {
              const renderedPreview = renderMessageTemplate(
                template.messageTemplate,
                prospect
              )
              const isSelected = selectedTemplateId === template.id

              return (
                <Card
                  key={template.id}
                  className={isSelected ? "border-primary" : undefined}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {isSelected ? <Badge>Seleccionada</Badge> : null}
                    </div>
                    <CardDescription>Vista previa del mensaje final</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">
                      {renderedPreview}
                    </p>
                    <div className="flex justify-end">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => {
                          setSelectedTemplateId(template.id)
                          prepareTemplate(template.id)
                        }}
                      >
                        Usar plantilla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>¿Deseas actualizar el estado de este cliente?</DialogTitle>
            <DialogDescription>
              Puedes actualizar el estado antes de abrir WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {selectedTemplate ? (
              <p className="text-sm text-muted-foreground">
                        Plantilla seleccionada: <span className="font-medium">{selectedTemplate.name}</span>
              </p>
            ) : null}

            <Select
              value={statusChoice}
              onValueChange={(value) => setStatusChoice(value as StatusChoice)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="no-change">No cambiar estado</SelectItem>
              </SelectContent>
            </Select>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vista previa del mensaje final</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">
                  {preparedMessage}
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAllDialogs} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmStatusAndOpen} disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
