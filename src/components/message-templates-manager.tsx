"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  createMessageTemplate,
  deleteMessageTemplate,
  updateMessageTemplate,
} from "@/app/actions"
import {
  isVariableToken,
  splitTemplateByVariables,
} from "@/lib/message-template"
import {
  MESSAGE_TEMPLATE_FIELDS,
  type MessageTemplate,
} from "@/types/message-template"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type MessageTemplatesManagerProps = {
  templates: MessageTemplate[]
}

type EditorMode = "create" | "edit"

type CursorRange = {
  start: number
  end: number
}

const EMPTY_FORM = {
  id: "",
  name: "",
  messageTemplate: "",
}

function formatCreatedAt(value: Date | string) {
  return new Date(value).toLocaleString("es-DO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MessageTemplatesManager({ templates }: MessageTemplatesManagerProps) {
  const router = useRouter()
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [deleteTemplateId, setDeleteTemplateId] = useState("")
  const [editorMode, setEditorMode] = useState<EditorMode>("create")
  const [formError, setFormError] = useState("")
  const [formValues, setFormValues] = useState(EMPTY_FORM)
  const [cursorRange, setCursorRange] = useState<CursorRange>({ start: 0, end: 0 })
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const previewTokens = useMemo(
    () => splitTemplateByVariables(formValues.messageTemplate),
    [formValues.messageTemplate]
  )

  function openCreateDialog() {
    setEditorMode("create")
    setFormValues(EMPTY_FORM)
    setFormError("")
    setCursorRange({ start: 0, end: 0 })
    setIsEditorOpen(true)
  }

  function openEditDialog(template: MessageTemplate) {
    setEditorMode("edit")
    setFormValues({
      id: template.id,
      name: template.name,
      messageTemplate: template.messageTemplate,
    })
    setFormError("")
    setIsEditorOpen(true)
  }

  function setMessageTemplateAtCursor(token: string) {
    setFormValues((previous) => {
      const start = cursorRange.start
      const end = cursorRange.end
      const nextMessage =
        previous.messageTemplate.slice(0, start) +
        token +
        previous.messageTemplate.slice(end)

      const nextCursorPosition = start + token.length
      setCursorRange({ start: nextCursorPosition, end: nextCursorPosition })

      setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition)
      }, 0)

      return {
        ...previous,
        messageTemplate: nextMessage,
      }
    })
  }

  function updateCursorRange() {
    if (!textareaRef.current) {
      return
    }

    setCursorRange({
      start: textareaRef.current.selectionStart,
      end: textareaRef.current.selectionEnd,
    })
  }

  function validateForm() {
    if (!formValues.name.trim()) {
        setFormError("El nombre de la plantilla es obligatorio.")
      return false
    }

    if (!formValues.messageTemplate.trim()) {
        setFormError("El contenido de la plantilla es obligatorio.")
      return false
    }

    return true
  }

  function handleSaveTemplate() {
    setFormError("")

    if (!validateForm()) {
      return
    }

    startSaving(async () => {
      const response =
        editorMode === "create"
          ? await createMessageTemplate({
              name: formValues.name,
              messageTemplate: formValues.messageTemplate,
            })
          : await updateMessageTemplate({
              id: formValues.id,
              name: formValues.name,
              messageTemplate: formValues.messageTemplate,
            })

      if (!response.success) {
        setFormError(response.error ?? "No se pudo guardar la plantilla.")
        return
      }

      setIsEditorOpen(false)
      setFormValues(EMPTY_FORM)
      router.refresh()
      toast.success(
        editorMode === "create"
          ? "Plantilla creada correctamente."
          : "Plantilla actualizada correctamente."
      )
    })
  }

  function handleDeleteTemplate(id: string) {
    startDeleting(async () => {
      const response = await deleteMessageTemplate(id)

      if (!response.success) {
        toast.error(response.error ?? "No se pudo eliminar la plantilla.")
        return
      }

      setDeleteTemplateId("")
      router.refresh()
      toast.success("Plantilla eliminada correctamente.")
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Plantillas de mensajes</h1>
          <p className="text-sm text-muted-foreground">
            Crea y administra plantillas dinámicas para WhatsApp.
          </p>
        </div>

        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Crear plantilla</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editorMode === "create" ? "Crear plantilla" : "Editar plantilla"}
              </DialogTitle>
              <DialogDescription>
                Usa variables con formato <code>{"{{field_name}}"}</code> para personalizar
                mensajes.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <div className="grid gap-3">
                <Input
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Nombre de la plantilla"
                />
                <Textarea
                  ref={textareaRef}
                  value={formValues.messageTemplate}
                  onChange={(event) =>
                    setFormValues((previous) => ({
                      ...previous,
                      messageTemplate: event.target.value,
                    }))
                  }
                  onClick={updateCursorRange}
                  onKeyUp={updateCursorRange}
                  onSelect={updateCursorRange}
                  onDrop={(event) => {
                    event.preventDefault()
                    const token = event.dataTransfer.getData("text/plain")

                    if (!token.startsWith("{{") || !token.endsWith("}}")) {
                      return
                    }

                    setMessageTemplateAtCursor(token)
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  placeholder="Hola {{name}}, vimos tu negocio de tipo {{business_type}}."
                  className="min-h-48"
                />

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Vista previa</CardTitle>
                    <CardDescription>
                      Variables resaltadas para validar tu plantilla.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex min-h-24 flex-wrap gap-1 rounded-md border bg-muted/40 p-3 text-sm">
                    {previewTokens.length === 0 ? (
                      <span className="text-muted-foreground">Sin contenido.</span>
                    ) : (
                      previewTokens.map((token, index) =>
                        isVariableToken(token) ? (
                          <Badge key={`${token}-${index}`} variant="secondary">
                            {token}
                          </Badge>
                        ) : (
                          <span key={`${token}-${index}`}>{token}</span>
                        )
                      )
                    )}
                  </CardContent>
                </Card>

                {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Campos disponibles</CardTitle>
                  <CardDescription>
                    Haz click o arrastra para insertar en la posición actual del cursor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {MESSAGE_TEMPLATE_FIELDS.map((field) => {
                    const token = `{{${field.key}}}`

                    return (
                      <Button
                        key={field.key}
                        variant="outline"
                        className="justify-start"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", token)
                          event.dataTransfer.effectAllowed = "copy"
                        }}
                        onClick={() => setMessageTemplateAtCursor(token)}
                      >
                        {field.label}
                        <span className="ml-2 text-xs text-muted-foreground">{token}</span>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditorOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveTemplate} disabled={isSaving}>
                {isSaving ? "Guardando..." : editorMode === "create" ? "Crear" : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No hay plantillas todavía. Crea tu primera plantilla de mensaje.
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>
                      Creada el {formatCreatedAt(template.createdAt)}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="line-clamp-4 whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">
                  {template.messageTemplate}
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => openEditDialog(template)}>
                  Editar
                </Button>
                <Dialog
                  open={deleteTemplateId === template.id}
                  onOpenChange={(open) => setDeleteTemplateId(open ? template.id : "")}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteTemplateId(template.id)}
                      disabled={isDeleting}
                    >
                      Eliminar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Eliminar plantilla</DialogTitle>
                      <DialogDescription>
                        Esta acción eliminará la plantilla de forma permanente.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteTemplateId("")}
                        disabled={isDeleting}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Eliminando..." : "Confirmar eliminación"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
