"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteDealer, updateDealer } from "@/app/actions"
import { OpenWhatsAppButton } from "@/components/open-whatsapp-button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  formatPhoneDisplay,
  isValidDominicanPhone,
  sanitizePhone,
} from "@/lib/phone"
import type { MessageTemplate } from "@/types/message-template"
import type { Prospect } from "@/types/prospect"
import { Button } from "./ui/button"

type ProspectDetailDialogProps = {
  prospect: Prospect | null
  templates: MessageTemplate[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = {
  id: string
  name: string
  businessType: string
  phone: string
  instagram: string
  location: string
  companyType: string
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  businessType: "",
  phone: "",
  instagram: "",
  location: "",
  companyType: "",
}

export function ProspectDetailDialog({
  prospect,
  templates,
  open,
  onOpenChange,
}: ProspectDetailDialogProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [formError, setFormError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [formValues, setFormValues] = useState<FormState>(EMPTY_FORM)

  if (!prospect) {
    return null
  }

  function startEditing() {
    if (!prospect) {
      return
    }

    setFormValues({
      id: prospect.id,
      name: prospect.name,
      businessType: prospect.businessType,
      phone: formatPhoneDisplay(prospect.phone),
      instagram: prospect.instagram ?? "",
      location: prospect.location,
      companyType: prospect.companyType,
    })
    setFormError("")
    setPhoneError("")
    setIsEditing(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setIsEditing(false)
      setFormError("")
      setPhoneError("")
      setFormValues(EMPTY_FORM)
    }

    onOpenChange(nextOpen)
  }

  function handleSave() {
    setFormError("")
    setPhoneError("")

    const sanitizedPhone = sanitizePhone(formValues.phone)

    if (!sanitizedPhone) {
      setPhoneError("El teléfono es obligatorio.")
      return
    }

    if (!isValidDominicanPhone(formValues.phone)) {
      setPhoneError("El teléfono debe ser dominicano y válido.")
      return
    }

    startSaving(async () => {
      const response = await updateDealer(formValues)

      if (!response.success) {
        setFormError(response.error ?? "No se pudo actualizar el prospecto.")
        return
      }

      toast.success("Prospecto actualizado.")
      setIsEditing(false)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!prospect) {
      return
    }

    const prospectId = prospect.id
    const shouldDelete = window.confirm(
      "¿Deseas descartar este prospecto? Pasará a estado inactivo."
    )

    if (!shouldDelete) {
      return
    }

    startDeleting(async () => {
      const response = await deleteDealer(prospectId)

      if (!response.success) {
        toast.error(response.error ?? "No se pudo eliminar el prospecto.")
        return
      }

      toast.success("Prospecto marcado como inactivo.")
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de Posible Cliente</DialogTitle>
          <DialogDescription>
            Información completa del prospecto seleccionado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isEditing ? (
            <div className="grid gap-3">
              <Input
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="Nombre"
              />
              <Input
                value={formValues.businessType}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    businessType: event.target.value,
                  }))
                }
                placeholder="Tipo de negocio"
              />
              <Field>
                <FieldLabel htmlFor="prospectPhone">Teléfono</FieldLabel>
                <Input
                  id="prospectPhone"
                  value={formValues.phone}
                  onChange={(event) => {
                    setFormValues((previous) => ({
                      ...previous,
                      phone: formatPhoneDisplay(event.target.value),
                    }))

                    if (phoneError) {
                      setPhoneError("")
                    }
                  }}
                  placeholder="+1 809 555 1234"
                />
                <FieldError>{phoneError}</FieldError>
              </Field>
              <Input
                value={formValues.instagram}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    instagram: event.target.value,
                  }))
                }
                placeholder="Instagram (ej: autooutletrd)"
              />
              <Input
                value={formValues.location}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    location: event.target.value,
                  }))
                }
                placeholder="Ubicación"
              />
              <Input
                value={formValues.companyType}
                onChange={(event) =>
                  setFormValues((previous) => ({
                    ...previous,
                    companyType: event.target.value,
                  }))
                }
                placeholder="Tipo de empresa"
              />
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            </div>
          ) : (
            <div className="grid gap-3 text-sm">
              <p>
                <span className="font-medium">Nombre:</span> {prospect.name}
              </p>
              <p>
                <span className="font-medium">Tipo de negocio:</span> {prospect.businessType}
              </p>
              <p>
                <span className="font-medium">Teléfono:</span> {prospect.phone}
              </p>
              <p>
                <span className="font-medium">WhatsApp:</span> {prospect.phone}
              </p>
              <p>
                <span className="font-medium">Instagram:</span> {prospect.instagram ? `@${prospect.instagram}` : "No definido"}
              </p>
              <p>
                <span className="font-medium">Ubicación:</span> {prospect.location}
              </p>
              <p>
                <span className="font-medium">Tipo de empresa:</span> {prospect.companyType}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium">Estado:</span>
                {!prospect.isActive ? (
                  <Badge variant="secondary">Inactivo</Badge>
                ) : prospect.contacted ? (
                  <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                    Contactado
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pendiente</Badge>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isSaving || !prospect.isActive}
          >
            {isDeleting ? "Descartando..." : "Descartar"}
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={startEditing} disabled={!prospect.isActive}>
                  Editar
                </Button>
                {prospect.phone && prospect.isActive ? (
                  <OpenWhatsAppButton prospect={prospect} templates={templates} />
                ) : null}
                {prospect.instagram && prospect.isActive ? (
                  <Button variant="outline" asChild>
                    <a
                      href={`https://instagram.com/${prospect.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Instagram
                    </a>
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
