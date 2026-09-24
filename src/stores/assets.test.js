import { describe, it, expect } from 'vitest'
import { mapItem, formatSize, normalizeDate, EXT_TO_TYPE } from './assets'

describe('EXT_TO_TYPE', () => {
  it('maps known extensions to their type', () => {
    expect(EXT_TO_TYPE.jpg).toBe('img')
    expect(EXT_TO_TYPE.mp4).toBe('vid')
    expect(EXT_TO_TYPE.pdf).toBe('pdf')
    expect(EXT_TO_TYPE.xlsx).toBe('xls')
    expect(EXT_TO_TYPE.mp3).toBe('aud')
  })
})

describe('formatSize', () => {
  it('formats sub-KB sizes', () => {
    expect(formatSize(0.0005)).toBe('< 1 KB')
  })
  it('formats KB sizes', () => {
    expect(formatSize(0.5)).toBe('512 KB')
  })
  it('formats MB sizes', () => {
    expect(formatSize(12.3)).toBe('12.3 MB')
  })
  it('formats GB sizes', () => {
    expect(formatSize(2048)).toBe('2.00 GB')
  })
  it('handles zero and missing values', () => {
    expect(formatSize(0)).toBe('< 1 KB')
    expect(formatSize(null)).toBe('')
    expect(formatSize(undefined)).toBe('')
  })
})

describe('normalizeDate', () => {
  it('converts backend space-separated format to ISO', () => {
    expect(normalizeDate('2026-03-31 10:45')).toBe('2026-03-31T10:45:00')
  })
  it('returns empty string for falsy input', () => {
    expect(normalizeDate('')).toBe('')
    expect(normalizeDate(null)).toBe('')
  })
})

describe('mapItem', () => {
  const starred = new Set(['5'])

  it('maps a search result row to the normalized item shape', () => {
    const row = {
      id: 5,
      filename: 'foto.JPG',
      ext: '.jpg',
      rel_path: 'pasta/foto.jpg',
      size_mb: 1.2,
      modified_at: '2026-03-31 10:45',
      campaign: 'Natal',
      tags: ['a', 'b'],
    }
    const item = mapItem(row, starred)
    expect(item.id).toBe('5')
    expect(item.type).toBe('img')
    expect(item.ext).toBe('JPG')
    expect(item.size).toBe('1.2 MB')
    expect(item.date).toBe('2026-03-31T10:45:00')
    expect(item.starred).toBe(true)
    expect(item.thumbnail).toContain('foto.jpg')
  })

  it('falls back to "unk" type for unrecognized extensions', () => {
    const item = mapItem({ id: 1, filename: 'file.xyz', ext: 'xyz', rel_path: 'file.xyz' }, new Set())
    expect(item.type).toBe('unk')
    expect(item.thumbnail).toBeNull()
  })

  it('marks starred:false for ids not in the starred set', () => {
    const item = mapItem({ id: 99, filename: 'a.png', ext: 'png', rel_path: 'a.png' }, starred)
    expect(item.starred).toBe(false)
  })
})
