export type Lang = 'th' | 'en'

export const LANGS: { id: Lang; short: string; name: string }[] = [
  { id: 'th', short: 'TH', name: 'ไทย' },
  { id: 'en', short: 'EN', name: 'English' },
]

/** ข้อความที่มีครบทุกภาษา ใช้กับเนื้อหาที่อยู่ในไฟล์ content */
export type L = Record<Lang, string>
