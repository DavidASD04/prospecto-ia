import { NextResponse } from "next/server"

import { getSession } from "@/lib/auth"
import { isValidDominicanPhone, sanitizePhone } from "@/lib/phone"
import { prisma } from "@/lib/prisma"

type CompanyImportPayload = {
  name?: string
  business_type?: string
  phone?: string
  instagram?: string
  contact_method?: "whatsapp" | "instagram" | "both" | "none"
  location?: string
  company_size?: string
  status?: string
}

type ImportSkipReason =
  | "missing_required_fields"
  | "invalid_phone"
  | "duplicate_phone"
  | "duplicate_instagram"
  | "duplicate_name"

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function sanitizeInstagramHandle(value: string) {
  return value
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\?.*$/, "")
    .replace(/\/.*/, "")
    .replace(/[^a-zA-Z0-9._]/g, "")
    .toLowerCase()
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

function addSkipReason(
  target: Partial<Record<ImportSkipReason, number>>,
  reason: ImportSkipReason
) {
  target[reason] = (target[reason] ?? 0) + 1
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: CompanyImportPayload[]

  try {
    payload = (await request.json()) as CompanyImportPayload[]
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!Array.isArray(payload) || payload.length === 0) {
    return NextResponse.json({ error: "No records to import." }, { status: 400 })
  }

  const preparedRows = payload.map((row) => {
    const name = String(row.name ?? "").trim()
    const businessType = String(row.business_type ?? "").trim()
    const phoneRaw = String(row.phone ?? "").trim()
    const instagramRaw = String(row.instagram ?? "").trim()
    const contactMethodRaw = row.contact_method
    const location = String(row.location ?? "").trim()
    const companyType = String(row.company_size ?? "").trim()
    const status = String(row.status ?? "lead").trim().toLowerCase()
    const phone = sanitizePhone(phoneRaw)
    const instagram = sanitizeInstagramHandle(instagramRaw)

    return {
      name,
      businessType,
      phone,
      phoneRaw,
      instagram,
      contactMethodRaw,
      location,
      companyType,
      status,
    }
  })

  const existing = await prisma.dealer.findMany({
    where: {
      OR: [
        {
          phone: {
            in: preparedRows.map((row) => row.phone).filter(Boolean),
          },
        },
        {
          instagram: {
            in: preparedRows.map((row) => row.instagram).filter(Boolean),
          },
        },
        {
          name: {
            in: preparedRows.map((row) => row.name).filter(Boolean),
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

  const existingPhones = new Set(existing.map((record) => record.phone))
  const existingInstagrams = new Set(
    existing.map((record) => record.instagram).filter(Boolean)
  )
  const existingNames = new Set(existing.map((record) => normalizeName(record.name)))
  const seenPhones = new Set<string>()
  const seenInstagrams = new Set<string>()
  const seenNames = new Set<string>()
  const skippedByReason: Partial<Record<ImportSkipReason, number>> = {}

  const insertable = preparedRows.filter((row) => {
    if (!row.name || (!row.phone && !row.instagram)) {
      addSkipReason(skippedByReason, "missing_required_fields")
      return false
    }

    if (row.phone && !isValidDominicanPhone(row.phoneRaw)) {
      addSkipReason(skippedByReason, "invalid_phone")
      return false
    }

    const normalizedName = normalizeName(row.name)

    const isDuplicatePhone =
      Boolean(row.phone) && (existingPhones.has(row.phone) || seenPhones.has(row.phone))
    if (isDuplicatePhone) {
      addSkipReason(skippedByReason, "duplicate_phone")
      return false
    }

    const isDuplicateInstagram =
      Boolean(row.instagram) &&
      (existingInstagrams.has(row.instagram) || seenInstagrams.has(row.instagram))
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

    if (row.phone) {
      seenPhones.add(row.phone)
    }
    if (row.instagram) {
      seenInstagrams.add(row.instagram)
    }
    seenNames.add(normalizedName)

    return true
  })

  if (insertable.length === 0) {
    return NextResponse.json({
      inserted: 0,
      skipped: payload.length,
      skippedByReason,
    })
  }

  const result = await prisma.$transaction(async (tx) => {
    return tx.dealer.createMany({
      data: insertable.map((row) => ({
        name: row.name,
        businessType: row.businessType || "Sin categoría",
        phone: row.phone || null,
        instagram: row.instagram || null,
        contactMethod:
          row.contactMethodRaw === "whatsapp" ||
          row.contactMethodRaw === "instagram" ||
          row.contactMethodRaw === "both" ||
          row.contactMethodRaw === "none"
            ? row.contactMethodRaw
            : resolveContactMethod(row.phone, row.instagram),
        location: row.location || "Sin ubicación",
        companyType: row.companyType || "Sin tipo",
        contacted: ["activo", "contactado", "active", "contacted"].includes(
          row.status
        ),
        createdById: session.user.id,
      })),
      skipDuplicates: true,
    })
  })

  return NextResponse.json({
    inserted: result.count,
    skipped: payload.length - result.count,
    skippedByReason,
  })
}
