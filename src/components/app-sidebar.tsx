"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrainCircuit, MessageSquareText, Settings, UserPlus, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserNav } from "@/components/user-nav"

type NavigationItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  { label: "Clientes Activos", href: "/clientes-activos", icon: Users },
  { label: "Posibles Clientes", href: "/posibles-clientes", icon: UserPlus },
  { label: "Buscador IA", href: "/buscador-ia", icon: BrainCircuit },
  { label: "Plantillas", href: "/message-templates", icon: MessageSquareText },
  { label: "Configuración", href: "/configuracion", icon: Settings },
]

type AppSidebarProps = {
  userName: string
  userEmail: string
}

export function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader className="px-3 py-4">
        <h2 className="text-base font-semibold">ORBIZ</h2>
        <p className="text-xs text-muted-foreground">Sistema de Control</p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <UserNav userName={userName} userEmail={userEmail} />
      </SidebarFooter>
    </Sidebar>
  )
}
