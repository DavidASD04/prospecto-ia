"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { updateProfileSettings } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type ProfileSettingsFormProps = {
  initialName: string
  initialEmail: string
}

export function ProfileSettingsForm({
  initialName,
  initialEmail,
}: ProfileSettingsFormProps) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          setError("")
          setSuccess("")

          const result = await updateProfileSettings(formData)

          if (!result.success) {
            setError(result.error ?? "No se pudo actualizar el perfil.")
            return
          }

          setSuccess("Perfil actualizado correctamente.")
          router.refresh()
        })
      }}
      className="grid gap-4"
    >
      <Field>
        <FieldLabel htmlFor="name">Nombre</FieldLabel>
        <Input id="name" name="name" defaultValue={initialName} required />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
        <Input id="email" name="email" defaultValue={initialEmail} required />
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
        <Input id="password" name="password" type="password" placeholder="********" />
      </Field>

      {error ? <FieldError>{error}</FieldError> : null}
      {success ? <p className="text-sm text-chart-2">{success}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  )
}
