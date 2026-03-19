import { requireAuthUser } from "@/lib/auth"
import { AppSidebar } from "@/components/app-sidebar"
import { prisma } from "@/lib/prisma"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionUser = await requireAuthUser()

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
    },
  })

  const userName = user?.name ?? "Usuario"
  const userEmail = user?.email ?? ""

  return (
    <SidebarProvider>
      <AppSidebar userName={userName} userEmail={userEmail} />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/90 px-4 backdrop-blur-sm md:px-6">
          <SidebarTrigger className="mr-2" />
          <h1 className="text-sm font-medium text-muted-foreground">
            ORBIZ Dashboard
          </h1>
        </header>
        <div className="min-w-0 flex-1 overflow-x-hidden bg-muted/30">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
