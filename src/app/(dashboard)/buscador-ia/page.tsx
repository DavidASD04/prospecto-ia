import { requireAuthUser } from "@/lib/auth"
import { AISearch } from "@/components/ai-search"

export const dynamic = "force-dynamic"

export default async function BuscadorIAPage() {
  await requireAuthUser()

  return <AISearch />
}
