"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { createDealer, updateDealerContacted } from "@/app/actions"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPhoneDisplay, isValidDominicanPhone, sanitizePhone } from "@/lib/phone"

type Dealer = {
  id: string
  name: string
  businessType: string
  contactPhone: string
  location: string
  companyType: string
  contacted: boolean
}

type FilterMode = "all" | "contacted" | "not-contacted"

type DealersCRMProps = {
  initialDealers: Dealer[]
}

function toWhatsAppUrl(phone: string) {
  const normalizedPhone = phone.replace(/\D/g, "")
  return `https://wa.me/${normalizedPhone}?text=Hola`
}

export function DealersCRM({ initialDealers }: DealersCRMProps) {
  const router = useRouter()
  const [filterMode, setFilterMode] = useState<FilterMode>("all")
  const [search, setSearch] = useState("")
  const [phoneInput, setPhoneInput] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [formError, setFormError] = useState("")
  const [isSubmitting, startSubmitting] = useTransition()
  const [isUpdating, startUpdating] = useTransition()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredDealers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return initialDealers.filter((dealer) => {
      const matchesFilter =
        filterMode === "all" ||
        (filterMode === "contacted" && dealer.contacted) ||
        (filterMode === "not-contacted" && !dealer.contacted)

      const matchesSearch =
        normalizedSearch.length === 0 ||
        dealer.name.toLowerCase().includes(normalizedSearch)

      return matchesFilter && matchesSearch
    })
  }, [filterMode, initialDealers, search])

  const filterButtonStyle = (mode: FilterMode) =>
    mode === filterMode ? "default" : "outline"

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dealers CRM</h1>
          <p className="text-sm text-muted-foreground">
            Manage Santo Domingo car dealers and contact them via WhatsApp.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Dealer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Dealer</DialogTitle>
              <DialogDescription>
                Save a new dealer you want to contact.
              </DialogDescription>
            </DialogHeader>

            <form
              action={(formData) => {
                startSubmitting(async () => {
                  setFormError("")
                  setPhoneError("")

                  const phoneValue = String(formData.get("contactPhone") ?? "")
                  const sanitizedPhone = sanitizePhone(phoneValue)

                  if (!sanitizedPhone) {
                    setPhoneError("Phone is required.")
                    return
                  }

                  if (sanitizedPhone.length < 10) {
                    setPhoneError("Phone must contain at least 10 digits.")
                    return
                  }

                  if (!isValidDominicanPhone(phoneValue)) {
                    setPhoneError("Phone must be a valid Dominican number.")
                    return
                  }

                  const result = await createDealer(formData)

                  if (!result.success) {
                    setFormError(result.error ?? "Unable to save dealer.")
                    return
                  }

                  setPhoneInput("")
                  setIsDialogOpen(false)
                  router.refresh()
                })
              }}
              className="grid gap-3"
            >
              <Input name="name" placeholder="Name" required />
              <Input name="businessType" placeholder="Business Type" required />
              <Field>
                <FieldLabel htmlFor="contactPhone">Phone</FieldLabel>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  placeholder="+1 809 555 1234"
                  value={phoneInput}
                  onChange={(event) => {
                    setPhoneInput(formatPhoneDisplay(event.target.value))
                    if (phoneError) {
                      setPhoneError("")
                    }
                  }}
                  inputMode="tel"
                  required
                />
                <FieldError>{phoneError}</FieldError>
              </Field>
              <Input name="location" placeholder="Location" required />
              <Input name="companyType" placeholder="Company Type" required />

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Dealer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filterButtonStyle("all")}
            onClick={() => setFilterMode("all")}
          >
            All
          </Button>
          <Button
            variant={filterButtonStyle("contacted")}
            onClick={() => setFilterMode("contacted")}
          >
            Contacted
          </Button>
          <Button
            variant={filterButtonStyle("not-contacted")}
            onClick={() => setFilterMode("not-contacted")}
          >
            Not Contacted
          </Button>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
          className="w-full md:w-72"
        />
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Business Type</TableHead>
              <TableHead>Contact Phone</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Company Type</TableHead>
              <TableHead>Contacted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDealers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No dealers match your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredDealers.map((dealer) => (
                <TableRow key={dealer.id}>
                  <TableCell>{dealer.name}</TableCell>
                  <TableCell>{dealer.businessType}</TableCell>
                  <TableCell>{dealer.contactPhone}</TableCell>
                  <TableCell>{dealer.location}</TableCell>
                  <TableCell>{dealer.companyType}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={dealer.contacted}
                        disabled={isUpdating}
                        onCheckedChange={(checked) => {
                          startUpdating(async () => {
                            const result = await updateDealerContacted(
                              dealer.id,
                              checked === true
                            )

                            if (result.success) {
                              router.refresh()
                            }
                          })
                        }}
                        aria-label={`Mark ${dealer.name} as contacted`}
                      />
                      {dealer.contacted ? (
                        <Badge className="border-transparent bg-chart-2/20 text-chart-2">
                          Contacted
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not Contacted</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" asChild>
                      <a
                        href={toWhatsAppUrl(dealer.contactPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open WhatsApp
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
