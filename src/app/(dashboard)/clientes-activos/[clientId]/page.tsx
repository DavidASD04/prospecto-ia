import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getActiveClientById } from "@/lib/active-clients"

type PageProps = {
  params: Promise<{ clientId: string }>
}

export default async function ClienteActivoDetallePage({ params }: PageProps) {
  const { clientId } = await params
  const client = getActiveClientById(clientId)

  if (!client) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Detalle de Cliente Activo</h1>
        <Button variant="outline" asChild>
          <Link href="/clientes-activos">Volver</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{client.company}</CardTitle>
          <CardDescription>
            Información básica del cliente activo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <p>
            <span className="font-medium">Contacto:</span> {client.contact}
          </p>
          <p>
            <span className="font-medium">Teléfono:</span> {client.phone}
          </p>
          <p>
            <span className="font-medium">Plan:</span> {client.plan}
          </p>
          <p>
            <span className="font-medium">Estado:</span> {client.status}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
