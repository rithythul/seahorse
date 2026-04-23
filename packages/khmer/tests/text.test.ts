import { describe, expect, test } from 'bun:test'
import { isKhmer, detectLanguage, sanitizeFtsQuery } from '../src/text'

describe('isKhmer', () => {
  test('Khmer string', () => expect(isKhmer('សួស្ដី')).toBe(true))
  test('English string', () => expect(isKhmer('hello')).toBe(false))
  test('Mixed string', () => expect(isKhmer('hello សួស្ដី')).toBe(true))
})

describe('detectLanguage', () => {
  test('Khmer', () => expect(detectLanguage('សួស្ដី')).toBe('km'))
  test('English', () => expect(detectLanguage('hello world')).toBe('en'))
  test('Mixed', () => expect(detectLanguage('hello សួស្ដី')).toBe('mixed'))
})

describe('sanitizeFtsQuery', () => {
  test('wraps and escapes double quotes', () => {
    expect(sanitizeFtsQuery('hello "world"')).toBe('"hello ""world"""')
  })
})
