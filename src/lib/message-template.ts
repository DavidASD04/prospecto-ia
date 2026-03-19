import type { Prospect } from "@/types/prospect"

type TemplateContext = Prospect

function getStatusLabel(contacted: boolean) {
  return contacted ? "Contactado" : "Pendiente"
}

function resolveFieldValue(context: TemplateContext, field: string) {
  switch (field) {
    case "name":
      return context.name
    case "business_type":
      return context.businessType
    case "phone":
      return context.phone
    case "location":
      return context.location
    case "company_size":
      return context.companyType
    case "status":
      return getStatusLabel(context.contacted)
    default:
      return ""
  }
}

export function renderMessageTemplate(
  template: string,
  context: TemplateContext
): string {
  return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_fullMatch, rawField) => {
    const value = resolveFieldValue(context, String(rawField))

    if (!value) {
      return ""
    }

    return value
  })
}

export function splitTemplateByVariables(template: string) {
  return template.split(/({{\s*[a-zA-Z0-9_]+\s*}})/g).filter(Boolean)
}

export function isVariableToken(token: string) {
  return /^{{\s*[a-zA-Z0-9_]+\s*}}$/.test(token)
}
