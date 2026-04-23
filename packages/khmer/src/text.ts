export function isKhmer(text: string): boolean {
  return /[ក-៿]/.test(text)
}

export function sanitizeFtsQuery(query: string): string {
  return `"${query.replace(/"/g, '""')}"`
}

export function detectLanguage(text: string): 'km' | 'en' | 'mixed' {
  // Count only letter-class characters to avoid inflating ratios with combining marks
  const letters = [...text].filter(ch => /\p{L}/u.test(ch))
  if (letters.length === 0) return 'en'
  // Count Khmer consonants and independent vowels (base glyphs, not combining marks)
  const khmerCount = letters.filter(ch => /[ក-ឳ]/.test(ch)).length
  const ratio = khmerCount / letters.length
  if (ratio > 0.5) return 'km'
  if (ratio === 0) return 'en'
  return 'mixed'
}
