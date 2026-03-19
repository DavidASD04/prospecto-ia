export type ActiveClient = {
  id: string
  company: string
  contact: string
  phone: string
  businessType: string
  location: string
  companyType: string
  plan: string
  status: string
}

export const activeClients: ActiveClient[] = [
  {
    id: "auto-norte-srl",
    company: "Auto Norte SRL",
    contact: "María Hernández",
    phone: "18095551234",
    businessType: "Dealer de vehículos usados",
    location: "Santo Domingo",
    companyType: "Mediana",
    plan: "Pro",
    status: "Activo",
  },
  {
    id: "caribe-motors",
    company: "Caribe Motors",
    contact: "Luis Gómez",
    phone: "18295552345",
    businessType: "Dealer / broker de autos",
    location: "Santiago",
    companyType: "Grande",
    plan: "Enterprise",
    status: "Activo",
  },
]

export function getActiveClientById(clientId: string) {
  return activeClients.find((client) => client.id === clientId)
}
