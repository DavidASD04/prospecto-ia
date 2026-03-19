import { requireAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProfileSettingsForm } from "@/components/profile-settings-form"

export default async function ConfiguracionPage() {
  const sessionUser = await requireAuthUser()

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true,
      email: true,
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Ajustes personales del usuario autenticado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil de usuario</CardTitle>
          <CardDescription>
            Actualiza tus datos personales y seguridad de acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettingsForm
            initialName={user?.name ?? ""}
            initialEmail={user?.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  )
}
