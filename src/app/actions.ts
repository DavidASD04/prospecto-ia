"use server"

import { hash } from "bcryptjs"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"

import { getSession } from "@/lib/auth"
import { isValidDominicanPhone, sanitizePhone } from "@/lib/phone"
import { prisma } from "@/lib/prisma"
import type { ProspectImportRow } from "@/types/prospect"

type ActionResult = {
  success: boolean
  error?: string
}

type ImportResult = ActionResult & {
  insertedCount?: number
  skippedCount?: number
  skippedByReason?: Partial<Record<ImportSkipReason, number>>
}

type ImportSkipReason =
  | "missing_required_fields"
  | "invalid_phone"
  | "duplicate_phone"
  | "duplicate_instagram"
  | "duplicate_name"

type MessageTemplateActionResult = ActionResult & {
  templateId?: string
}

type MessageTemplateInput = {
  id?: string
  name: string
  messageTemplate: string
}

type WhatsAppStatusInput = {
  dealerId: string
  status: "contacted" | "pending"
}

function sanitizeInstagramHandle(value: string) {
  const cleaned = value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\?.*$/, "")
    .replace(/\/.*/, "")
    .replace(/[^a-zA-Z0-9._]/g, "")
    .toLowerCase()

  return cleaned
}

function resolveContactMethod(phone: string, instagram: string) {
  if (phone && instagram) {
    return "both" as const
  }

  if (phone) {
    return "whatsapp" as const
  }

  if (instagram) {
    return "instagram" as const
  }

  return "none" as const
}

function normalizeProspectName(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

function addSkipReason(
  target: Partial<Record<ImportSkipReason, number>>,
  reason: ImportSkipReason
) {
  target[reason] = (target[reason] ?? 0) + 1
}

export async function createDealer(formData: FormData) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  const name = String(formData.get("name") ?? "").trim()
  const businessType = String(formData.get("businessType") ?? "").trim()
  const phoneRaw = String(formData.get("phone") ?? formData.get("contactPhone") ?? "").trim()
  const instagramRaw = String(formData.get("instagram") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const companyType = String(formData.get("companyType") ?? "").trim()
  const phone = sanitizePhone(phoneRaw)
  const instagram = sanitizeInstagramHandle(instagramRaw)
  const contactMethod = resolveContactMethod(phone, instagram)

  if (!name) {
    return { success: false, error: "Name is required." } satisfies ActionResult
  }

  if (!phone) {
    return { success: false, error: "Contact phone is required." } satisfies ActionResult
  }

  if (!isValidDominicanPhone(phoneRaw)) {
    return {
      success: false,
      error: "Phone must be a valid Dominican number.",
    } satisfies ActionResult
  }

  if (!businessType || !location || !companyType) {
    return { success: false, error: "All fields are required." } satisfies ActionResult
  }

  const duplicate = await prisma.dealer.findFirst({
    where: {
      OR: [
        { phone },
        ...(instagram ? [{ instagram }] : []),
      ],
    },
    select: { id: true },
  })

  if (duplicate) {
    return {
      success: false,
      error: "Dealer with this phone number already exists.",
    } satisfies ActionResult
  }

  try {
    await prisma.dealer.create({
      data: {
        name,
        businessType,
        phone,
        instagram: instagram || null,
        contactMethod,
        location,
        companyType,
        createdById: session.user.id,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Dealer with this phone number already exists.",
      } satisfies ActionResult
    }

    return {
      success: false,
      error: "Unable to create dealer right now.",
    } satisfies ActionResult
  }

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function updateDealerContacted(id: string, contacted: boolean) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  if (!id) {
    return { success: false, error: "Invalid dealer id." } satisfies ActionResult
  }

  const result = await prisma.dealer.updateMany({
    where: {
      id,
      isActive: true,
    },
    data: { contacted },
  })

  if (result.count === 0) {
    return { success: false, error: "Dealer not found." } satisfies ActionResult
  }

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

type UpdateDealerInput = {
  id: string
  name: string
  businessType: string
  phone: string
  instagram: string
  location: string
  companyType: string
}

export async function updateDealer(input: UpdateDealerInput) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión." } satisfies ActionResult
  }

  const id = input.id.trim()
  const name = input.name.trim()
  const businessType = input.businessType.trim()
  const phoneRaw = input.phone.trim()
  const instagramRaw = input.instagram.trim()
  const location = input.location.trim()
  const companyType = input.companyType.trim()
  const phone = sanitizePhone(phoneRaw)
  const instagram = sanitizeInstagramHandle(instagramRaw)
  const contactMethod = resolveContactMethod(phone, instagram)

  if (!id) {
    return { success: false, error: "ID de prospecto inválido." } satisfies ActionResult
  }

  if (!name || !businessType || !location || !companyType) {
    return {
      success: false,
      error: "Todos los campos son obligatorios.",
    } satisfies ActionResult
  }

  if (!phone) {
    return {
      success: false,
      error: "El teléfono es obligatorio.",
    } satisfies ActionResult
  }

  if (!isValidDominicanPhone(phoneRaw)) {
    return {
      success: false,
      error: "El teléfono debe ser dominicano y válido.",
    } satisfies ActionResult
  }

  const duplicate = await prisma.dealer.findFirst({
    where: {
      OR: [
        { phone },
        ...(instagram ? [{ instagram }] : []),
      ],
      id: {
        not: id,
      },
    },
    select: { id: true },
  })

  if (duplicate) {
    return {
      success: false,
      error: "Ya existe otro prospecto con ese teléfono.",
    } satisfies ActionResult
  }

  const result = await prisma.dealer.updateMany({
    where: {
      id,
      isActive: true,
    },
    data: {
      name,
      businessType,
      phone,
      instagram: instagram || null,
      contactMethod,
      location,
      companyType,
    },
  })

  if (result.count === 0) {
    return { success: false, error: "Prospecto no encontrado." } satisfies ActionResult
  }

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function deleteDealer(id: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Debes iniciar sesión." } satisfies ActionResult
  }

  if (!id.trim()) {
    return { success: false, error: "ID de prospecto inválido." } satisfies ActionResult
  }

  const result = await prisma.dealer.updateMany({
    where: {
      id,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  })

  if (result.count === 0) {
    return { success: false, error: "Prospecto no encontrado." } satisfies ActionResult
  }

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function updateProfileSettings(formData: FormData) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "").trim()

  if (!name) {
    return { success: false, error: "Name is required." } satisfies ActionResult
  }

  if (!email) {
    return { success: false, error: "Email is required." } satisfies ActionResult
  }

  if (!email.includes("@")) {
    return { success: false, error: "Email is invalid." } satisfies ActionResult
  }

  if (password && password.length < 4) {
    return {
      success: false,
      error: "Password must contain at least 4 characters.",
    } satisfies ActionResult
  }

  const existingUserWithEmail = await prisma.user.findFirst({
    where: {
      email,
      id: {
        not: session.user.id,
      },
    },
    select: { id: true },
  })

  if (existingUserWithEmail) {
    return { success: false, error: "Email is already in use." } satisfies ActionResult
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email,
      ...(password ? { password: await hash(password, 12) } : {}),
    },
  })

  revalidatePath("/configuracion")

  return { success: true } satisfies ActionResult
}

export async function importProspectsBatch(rows: ProspectImportRow[]) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ImportResult
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return { success: false, error: "No rows provided." } satisfies ImportResult
  }

  const result = await prisma.$transaction(async (tx) => {
    const skippedByReason: Partial<Record<ImportSkipReason, number>> = {}

    const incoming = rows.map((row) => ({
      name: row.name.trim(),
      businessType: row.businessType.trim(),
      phoneRaw: row.phone.trim(),
      instagramRaw: row.instagram.trim(),
      location: row.location.trim(),
      companyType: row.companyType.trim(),
      contactMethodRaw: row.contactMethod,
    }))

    const phones = incoming
      .map((row) => sanitizePhone(row.phoneRaw))
      .filter(Boolean)

    const instagramHandles = incoming
      .map((row) => sanitizeInstagramHandle(row.instagramRaw))
      .filter(Boolean)

    const existing = await tx.dealer.findMany({
      where: {
        OR: [
          {
            phone: {
              in: phones,
            },
          },
          {
            instagram: {
              in: instagramHandles,
            },
          },
          {
            name: {
              in: incoming.map((row) => row.name),
            },
          },
        ],
      },
      select: {
        phone: true,
        instagram: true,
        name: true,
      },
    })

    const existingPhones = new Set(existing.map((dealer) => dealer.phone))
    const existingInstagramHandles = new Set(
      existing.map((dealer) => dealer.instagram).filter(Boolean)
    )
    const existingNames = new Set(
      existing.map((dealer) => normalizeProspectName(dealer.name))
    )

    const seenPhones = new Set<string>()
    const seenInstagramHandles = new Set<string>()
    const seenNames = new Set<string>()

    const validRows = incoming.filter((row) => {
      const sanitizedPhone = sanitizePhone(row.phoneRaw)
      const sanitizedInstagram = sanitizeInstagramHandle(row.instagramRaw)
      const normalizedName = normalizeProspectName(row.name)

      if (
        !row.name ||
        !row.businessType ||
        !row.location ||
        !row.companyType ||
        (!sanitizedPhone && !sanitizedInstagram)
      ) {
        addSkipReason(skippedByReason, "missing_required_fields")
        return false
      }

      if (sanitizedPhone && !isValidDominicanPhone(row.phoneRaw)) {
        addSkipReason(skippedByReason, "invalid_phone")
        return false
      }

      const isDuplicatePhone =
        Boolean(sanitizedPhone) &&
        (existingPhones.has(sanitizedPhone) || seenPhones.has(sanitizedPhone))
      if (isDuplicatePhone) {
        addSkipReason(skippedByReason, "duplicate_phone")
        return false
      }

      const isDuplicateInstagram =
        Boolean(sanitizedInstagram) &&
        (existingInstagramHandles.has(sanitizedInstagram) ||
          seenInstagramHandles.has(sanitizedInstagram))
      if (isDuplicateInstagram) {
        addSkipReason(skippedByReason, "duplicate_instagram")
        return false
      }

      const isDuplicateName =
        existingNames.has(normalizedName) || seenNames.has(normalizedName)
      if (isDuplicateName) {
        addSkipReason(skippedByReason, "duplicate_name")
        return false
      }

      if (sanitizedPhone) {
        seenPhones.add(sanitizedPhone)
      }
      if (sanitizedInstagram) {
        seenInstagramHandles.add(sanitizedInstagram)
      }
      seenNames.add(normalizedName)

      return true
    })

    if (validRows.length === 0) {
      return {
        insertedCount: 0,
        skippedCount: rows.length,
        skippedByReason,
      }
    }

    const createResult = await tx.dealer.createMany({
      data: validRows.map((row) => {
        const sanitizedInstagram = sanitizeInstagramHandle(row.instagramRaw)
        const computedContactMethod = resolveContactMethod(
          sanitizePhone(row.phoneRaw),
          sanitizedInstagram
        )

        return {
          name: row.name,
          businessType: row.businessType,
          phone: sanitizePhone(row.phoneRaw) || null,
          instagram: sanitizedInstagram || null,
          contactMethod:
            row.contactMethodRaw === "whatsapp" ||
            row.contactMethodRaw === "instagram" ||
            row.contactMethodRaw === "both" ||
            row.contactMethodRaw === "none"
              ? row.contactMethodRaw
              : computedContactMethod,
          location: row.location,
          companyType: row.companyType,
          createdById: session.user.id,
        }
      }),
      skipDuplicates: true,
    })

    return {
      insertedCount: createResult.count,
      skippedCount: rows.length - createResult.count,
      skippedByReason,
    }
  })

  revalidatePath("/")
  revalidatePath("/posibles-clientes")

  return {
    success: true,
    insertedCount: result.insertedCount,
    skippedCount: result.skippedCount,
    skippedByReason: result.skippedByReason,
  } satisfies ImportResult
}

export async function createMessageTemplate(input: MessageTemplateInput) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies MessageTemplateActionResult
  }

  const name = input.name.trim()
  const messageTemplate = input.messageTemplate.trim()

  if (!name) {
    return { success: false, error: "Template name is required." } satisfies MessageTemplateActionResult
  }

  if (!messageTemplate) {
    return {
      success: false,
      error: "Template content is required.",
    } satisfies MessageTemplateActionResult
  }

  try {
    const template = await prisma.messageTemplate.create({
      data: {
        name,
        messageTemplate,
        createdById: session.user.id,
      },
      select: { id: true },
    })

    revalidatePath("/message-templates")
    revalidatePath("/posibles-clientes")

    return {
      success: true,
      templateId: template.id,
    } satisfies MessageTemplateActionResult
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Template name already exists.",
      } satisfies MessageTemplateActionResult
    }

    return {
      success: false,
      error: "Unable to create template right now.",
    } satisfies MessageTemplateActionResult
  }
}

export async function updateMessageTemplate(input: MessageTemplateInput) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies MessageTemplateActionResult
  }

  const id = input.id?.trim() ?? ""
  const name = input.name.trim()
  const messageTemplate = input.messageTemplate.trim()

  if (!id) {
    return { success: false, error: "Invalid template id." } satisfies MessageTemplateActionResult
  }

  if (!name) {
    return { success: false, error: "Template name is required." } satisfies MessageTemplateActionResult
  }

  if (!messageTemplate) {
    return {
      success: false,
      error: "Template content is required.",
    } satisfies MessageTemplateActionResult
  }

  try {
    const result = await prisma.messageTemplate.updateMany({
      where: {
        id,
        
      },
      data: {
        name,
        messageTemplate,
      },
    })

    if (result.count === 0) {
      return { success: false, error: "Template not found." } satisfies MessageTemplateActionResult
    }

    revalidatePath("/message-templates")
    revalidatePath("/posibles-clientes")

    return {
      success: true,
      templateId: id,
    } satisfies MessageTemplateActionResult
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        error: "Template name already exists.",
      } satisfies MessageTemplateActionResult
    }

    return {
      success: false,
      error: "Unable to update template right now.",
    } satisfies MessageTemplateActionResult
  }
}

export async function deleteMessageTemplate(id: string) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  if (!id) {
    return { success: false, error: "Invalid template id." } satisfies ActionResult
  }

  const result = await prisma.messageTemplate.deleteMany({
    where: {
      id,
      
    },
  })

  if (result.count === 0) {
    return { success: false, error: "Template not found." } satisfies ActionResult
  }

  revalidatePath("/message-templates")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function updateDealerStatusForWhatsApp(input: WhatsAppStatusInput) {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." } satisfies ActionResult
  }

  if (!input.dealerId) {
    return { success: false, error: "Invalid dealer id." } satisfies ActionResult
  }

  const contacted = input.status === "contacted"

  const result = await prisma.dealer.updateMany({
    where: {
      id: input.dealerId,
      isActive: true,
    },
    data: {
      contacted,
    },
  })

  if (result.count === 0) {
    return { success: false, error: "Dealer not found." } satisfies ActionResult
  }

  revalidatePath("/clientes-activos")
  revalidatePath("/posibles-clientes")

  return { success: true } satisfies ActionResult
}

export async function deleteMultipleDealers(ids: string[]): Promise<ActionResult> {
  const session = await getSession()

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.dealer.updateMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    })
    
    revalidatePath("/(dashboard)/posibles-clientes", "page")
    revalidatePath("/(dashboard)/clientes-activos", "page")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete dealers:", error)
    return { success: false, error: "Error eliminando prospectos" }
  }
}
