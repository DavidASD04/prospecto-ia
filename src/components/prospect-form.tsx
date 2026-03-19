"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createDealer } from "@/app/actions"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
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
import {
  formatPhoneDisplay,
  isValidDominicanPhone,
  sanitizePhone,
} from "@/lib/phone"

export function ProspectForm() {
  const router = useRouter()
  const [phoneInput, setPhoneInput] = useState("")
  const [instagramInput, setInstagramInput] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, startSubmitting] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>Agregar prospecto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar prospecto</DialogTitle>
          <DialogDescription>
            Guarda un posible cliente para contacto comercial.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(formData) => {
            startSubmitting(async () => {
              setFormError("")
              setPhoneError("")

              const phoneValue = String(formData.get("phone") ?? "")
              const sanitizedPhone = sanitizePhone(phoneValue)

              if (!sanitizedPhone) {
                setPhoneError("El teléfono es obligatorio.")
                return
              }

              if (sanitizedPhone.length < 10) {
                setPhoneError("El teléfono debe tener al menos 10 dígitos.")
                return
              }

              if (!isValidDominicanPhone(phoneValue)) {
                setPhoneError("El teléfono debe ser dominicano y válido.")
                return
              }

              const result = await createDealer(formData)

              if (!result.success) {
                setFormError(result.error ?? "No se pudo guardar el prospecto.")
                return
              }

              setPhoneInput("")
              setInstagramInput("")
              setIsDialogOpen(false)
              router.refresh()
            })
          }}
          className="grid gap-3"
        >
          <Input name="name" placeholder="Nombre" required />
          <Input name="businessType" placeholder="Tipo de negocio" required />

          <Field>
            <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
            <Input
              id="phone"
              name="phone"
              placeholder="+1 809 555 1234"
              value={phoneInput}
              onChange={(event) => {
                setPhoneInput(formatPhoneDisplay(event.target.value))
                if (phoneError) {
                  setPhoneError("")
                }
              }}
              inputMode="tel"
              required
            />
            <FieldError>{phoneError}</FieldError>
          </Field>

          <Input
            name="instagram"
            placeholder="Instagram (ej: autooutletrd)"
            value={instagramInput}
            onChange={(event) => setInstagramInput(event.target.value)}
          />

          <Input name="location" placeholder="Ubicación" required />
          <Input name="companyType" placeholder="Tipo de empresa" required />

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar prospecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
