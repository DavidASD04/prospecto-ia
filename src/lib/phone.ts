const DOMINICAN_PREFIXES = ["809", "829", "849"]

export function sanitizePhone(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 0) {
    return ""
  }

  if (
    digits.length >= 10 &&
    DOMINICAN_PREFIXES.includes(digits.slice(0, 3))
  ) {
    return `1${digits.slice(0, 10)}`
  }

  if (
    digits.startsWith("1") &&
    digits.length >= 11 &&
    DOMINICAN_PREFIXES.includes(digits.slice(1, 4))
  ) {
    return digits.slice(0, 11)
  }

  return digits
}

export function isValidDominicanPhone(value: string) {
  const sanitized = sanitizePhone(value)

  if (sanitized.length < 11) {
    return false
  }

  if (!/^\d+$/.test(sanitized)) {
    return false
  }

  if (!sanitized.startsWith("1")) {
    return false
  }

  return DOMINICAN_PREFIXES.includes(sanitized.slice(1, 4))
}

export function formatPhoneDisplay(value: string) {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 0) {
    return ""
  }

  let country = ""
  let local = digits

  if (digits.startsWith("1")) {
    country = "1"
    local = digits.slice(1)
  } else if (DOMINICAN_PREFIXES.includes(digits.slice(0, 3))) {
    country = "1"
  }

  const localLimited = local.slice(0, 10)
  const area = localLimited.slice(0, 3)
  const first = localLimited.slice(3, 6)
  const second = localLimited.slice(6, 10)

  const chunks = [area, first, second].filter((chunk) => chunk.length > 0)

  if (country) {
    return [
      `+${country}`,
      ...chunks,
    ].join(" ")
  }

  return chunks.join(" ")
}
