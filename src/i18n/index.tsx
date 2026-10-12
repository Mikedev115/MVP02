import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { en } from './en'
import { th, type Key } from './th'
import type { L, Lang } from './types'

export type { Key } from './th'
export { LANGS, type L, type Lang } from './types'

const STORAGE_KEY = 'nudee-lang'
const DICTS: Record<Lang, Record<Key, string>> = { th, en }

const isLang = (v: unknown): v is Lang => v === 'th' || v === 'en'

/** ลำดับความสำคัญ: ?lang=en ในลิงก์ → ภาษาที่เคยเลือกไว้ → ไทย */
function initialLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (isLang(fromUrl)) return fromUrl
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  } catch {
    // บล็อก storage / ไม่มี window: ใช้ค่าเริ่มต้น
  }
  return 'th'
}

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  const text = DICTS[lang][key] ?? th[key]
  return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text
}

interface LangValue {
  lang: Lang
  setLang: (l: Lang) => void
  /** ข้อความจากพจนานุกรม เช่น t('hero.lead') หรือ t('common.minutes', { n: 60 }) */
  t: (key: Key, vars?: Record<string, string | number>) => string
  /** ข้อความที่มีครบทุกภาษาในไฟล์ content */
  l: (text: L) => string
}

const Ctx = createContext<LangValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // เก็บไม่ได้ก็ใช้ได้ในหน้านี้ต่อ
    }
  }, [])

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      l: (text) => text[lang] ?? text.th,
    }),
    [lang, setLang],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang(): LangValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('useLang must be used inside LangProvider')
  return v
}

/** ตั้งค่า <html lang> ให้ตรงกับภาษาของหน้านี้ และคืนค่าเดิมเมื่อออกจากหน้า */
export function useDocumentLang(lang: Lang) {
  useEffect(() => {
    const prev = document.documentElement.lang
    document.documentElement.lang = lang
    return () => {
      document.documentElement.lang = prev
    }
  }, [lang])
}
