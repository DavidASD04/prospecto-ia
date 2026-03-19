"use client"

import type { ActiveClient } from "@/lib/active-clients"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type ActiveClientDetailDialogProps = {
  client: ActiveClient
}

export function ActiveClientDetailDialog({ client }: ActiveClientDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Ver detalle</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle de Cliente Activo</DialogTitle>
          <DialogDescription>
            Información comercial del cliente seleccionado.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{client.company}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Nombre:</span> {client.company}
            </p>
            <p>
              <span className="font-medium">Tipo de negocio:</span> {client.businessType}
            </p>
            <p>
              <span className="font-medium">Teléfono:</span> {client.phone}
            </p>
            <p>
              <span className="font-medium">Ubicación:</span> {client.location}
            </p>
            <p>
              <span className="font-medium">Tipo de empresa:</span> {client.companyType}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-medium">Estado:</span>
              <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                {client.status}
              </Badge>
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
