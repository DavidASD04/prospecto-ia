export type MessageTemplate = {
  id: string
  name: string
  messageTemplate: string
  createdAt: Date
}

export type MessageTemplateFieldKey =
  | "name"
  | "business_type"
  | "phone"
  | "location"
  | "company_size"
  | "status"

export const MESSAGE_TEMPLATE_FIELDS: Array<{
  key: MessageTemplateFieldKey
  label: string
}> = [
  { key: "name", label: "Nombre" },
  { key: "business_type", label: "Tipo de negocio" },
  { key: "phone", label: "Teléfono" },
  { key: "location", label: "Ubicación" },
  { key: "company_size", label: "Tamaño empresa" },
  { key: "status", label: "Estado" },
]
