import { describe, expect, test } from 'bun:test'
import { toKhmerDigits, formatPrice, numberToKhmerWords } from '../src/numbers'

describe('toKhmerDigits', () => {
  test('converts 2025', () => expect(toKhmerDigits(2025)).toBe('២០២៥'))
  test('converts 0', () => expect(toKhmerDigits(0)).toBe('០'))
})

describe('formatPrice', () => {
  test('contains USD and riel', () => {
    const result = formatPrice(2.50)
    expect(result).toContain('$2.50')
    expect(result).toContain('រៀល')
  })
  test('applies thousand-separator before Khmer conversion', () => {
    expect(formatPrice(2.50)).toContain('១០,២៥០')
  })
})

describe('numberToKhmerWords', () => {
  test('0', () => expect(numberToKhmerWords(0)).toBe('សូន្យ'))
  test('5', () => expect(numberToKhmerWords(5)).toBe('ប្រាំ'))
  test('12', () => expect(numberToKhmerWords(12)).toBe('ដប់ពីរ'))
  test('100', () => expect(numberToKhmerWords(100)).toBe('មួយរយ'))
  test('1000', () => expect(numberToKhmerWords(1000)).toBe('មួយពាន់'))
  test('1234', () => expect(numberToKhmerWords(1234)).toBe('មួយពាន់ពីររយសាមសិបបួន'))
})
