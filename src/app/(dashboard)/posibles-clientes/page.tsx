import { prisma } from "@/lib/prisma"
import { requireAuthUser } from "@/lib/auth"
import { ProspectsTable } from "@/components/prospects-table"
import type { ContactMethod } from "@/types/prospect"

export const dynamic = "force-dynamic"

function normalizeContactMethod(value: string): ContactMethod {
  if (
    value === "whatsapp" ||
    value === "instagram" ||
    value === "both" ||
    value === "none"
  ) {
    return value
  }

  return "none"
}

export default async function PosiblesClientesPage() {
  const user = await requireAuthUser()

  const [prospects, templates] = await Promise.all([
    prisma.dealer.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.messageTemplate.findMany({
      where: { createdById: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        messageTemplate: true,
        createdAt: true,
      },
    }),
  ])

  const normalizedProspects = prospects.map((prospect) => ({
    ...prospect,
    phone: prospect.phone ?? "",
    contactMethod: normalizeContactMethod(prospect.contactMethod),
    isActive: prospect.isActive ?? true,
  }))

  return <ProspectsTable prospects={normalizedProspects} templates={templates} />
}
