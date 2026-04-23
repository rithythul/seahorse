export const KHR_RATE = 4100

const KHMER_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']

export function toKhmerDigits(n: number): string {
  return String(n)
    .split('')
    .map(ch => (ch >= '0' && ch <= '9' ? KHMER_DIGITS[parseInt(ch)] : ch))
    .join('')
}

export function formatPrice(usd: number): string {
  const riel = Math.round(usd * KHR_RATE)
  const rielFormatted = toKhmerDigits(riel).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `$${usd.toFixed(2)} (≈ ${rielFormatted} រៀល)`
}

const UNITS = [
  'សូន្យ', 'មួយ', 'ពីរ', 'បី', 'បួន',
  'ប្រាំ', 'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន',
]
const TENS = [
  '', 'ដប់', 'ម្ភៃ', 'សាមសិប', 'សែសិប',
  'ហាសិប', 'ហុកសិប', 'ចិតសិប', 'ប៉ែតសិប', 'កៅសិប',
]

export function numberToKhmerWords(n: number): string {
  if (n < 0 || n > 9999) throw new RangeError('n must be 0–9999')
  if (n < 10) return UNITS[n]

  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    return TENS[t] + (u > 0 ? UNITS[u] : '')
  }

  if (n < 1000) {
    const h = Math.floor(n / 100)
    const rest = n % 100
    return UNITS[h] + 'រយ' + (rest > 0 ? numberToKhmerWords(rest) : '')
  }

  const th = Math.floor(n / 1000)
  const rest = n % 1000
  return UNITS[th] + 'ពាន់' + (rest > 0 ? numberToKhmerWords(rest) : '')
}
