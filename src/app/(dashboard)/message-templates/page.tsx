import { requireAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MessageTemplatesManager } from "@/components/message-templates-manager"

export const dynamic = "force-dynamic"

export default async function MessageTemplatesPage() {
  const user = await requireAuthUser()

  const templates = await prisma.messageTemplate.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      messageTemplate: true,
      createdAt: true,
    },
  })

  return <MessageTemplatesManager templates={templates} />
}
