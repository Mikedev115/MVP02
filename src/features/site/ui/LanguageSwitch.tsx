import { LANGS, useLang } from '@/i18n'
import { cn } from '@/lib/format'

/** ปุ่มสลับภาษา TH | EN — ใช้ได้ทั้งบนพื้นสว่างและพื้นเข้ม */
export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <div role="group" aria-label={t('lang.label')} className={cn('inline-flex rounded-full border border-stone-300 bg-white/70 p-0.5 text-xs font-medium backdrop-blur', className)}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-pressed={l.id === lang}
          aria-label={t('lang.switchTo', { name: l.name })}
          title={l.name}
          onClick={() => setLang(l.id)}
          className={cn(
            'h-8 min-w-[2.25rem] rounded-full px-2.5 transition-colors duration-300',
            l.id === lang ? 'bg-olive-700 text-white' : 'text-bark-600 hover:text-bark-900',
          )}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
