/** เลื่อนไปยัง section ตาม id (เคารพการตั้งค่าลดการเคลื่อนไหว) */
export function scrollToSection(id: string) {
  const reduce = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (id === 'home') {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    return
  }
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}
