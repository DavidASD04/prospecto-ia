import { ActiveClientDetailDialog } from "@/components/active-client-detail-dialog"
import { Badge } from "@/components/ui/badge"
import { activeClients } from "@/lib/active-clients"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ClientesActivosPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes Activos</h1>
        <p className="text-base text-muted-foreground">
          Empresas que ya usan tu ERP con plan vigente.
        </p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table className="min-w-205">
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>{client.company}</TableCell>
                <TableCell>{client.contact}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell>{client.plan}</TableCell>
                <TableCell>
                  <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <ActiveClientDetailDialog client={client} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
