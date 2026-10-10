import { WHY_US } from '../content/site'
import { container, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'
import { SpaImage } from '../ui/SpaImage'

export function WhyUs() {
  return (
    <section className={`${sectionY} relative overflow-hidden bg-olive-900 text-olive-50`}>
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-olive-700/40 blur-3xl" />
      <div className={`${container} relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20`}>
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-olive-300">ทำไมต้องที่นี่</p>
          <h2 className="mt-4 font-serifth text-3xl font-normal leading-[1.5] sm:text-4xl sm:leading-[1.45] lg:text-[2.6rem]">
            ความสบายใจ
            <br />
            เริ่มตั้งแต่ก้าวแรกที่เข้ามา
          </h2>
          <SpaImage image="stones" alt="บรรยากาศร้านที่สงบ" width={900} className="mt-10 hidden aspect-[16/10] w-full rounded-[1.75rem] opacity-90 lg:block" />
        </Reveal>

        <ul>
          {WHY_US.map((w, i) => (
            <Reveal as="li" key={w.title} delay={i * 80} className="border-t border-olive-700 py-8 first:border-t-0 first:pt-0 sm:py-10">
              <div className="grid gap-4 sm:grid-cols-[5rem_1fr]">
                <span className="font-display text-5xl italic leading-none text-olive-400">{i + 1}</span>
                <div>
                  <h3 className="font-serifth text-xl text-white sm:text-2xl">{w.title}</h3>
                  <p className="mt-2.5 max-w-lg text-[15px] leading-relaxed text-olive-100/80">{w.text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
