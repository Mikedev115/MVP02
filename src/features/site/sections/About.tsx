import { PRINCIPLES } from '../content/site'
import { bodyText, container, displayTitle, eyebrow, sectionY } from '../tokens'
import { Reveal } from '../ui/Reveal'
import { SpaImage } from '../ui/SpaImage'

export function About() {
  return (
    <section id="about" className={`${sectionY} scroll-mt-16 bg-white`}>
      <div className={`${container} grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20`}>
        <Reveal className="relative mx-auto w-full max-w-md lg:max-w-none">
          <SpaImage image="hairWash" alt="เตียงสระผมเอนหลังในร้าน" width={1000} className="aspect-[4/5] w-full rounded-[2rem] rounded-br-[7rem]" imgClassName="object-[78%_72%]" />
          <SpaImage
            image="towel"
            alt="ผ้าขนหนูนุ่มและเทียนหอม"
            width={600}
            className="absolute -bottom-8 right-0 hidden h-44 w-36 rounded-2xl border-[6px] border-white shadow-card sm:block lg:-right-8"
          />
        </Reveal>

        <div>
          <Reveal>
            <p className={eyebrow}>เกี่ยวกับเรา</p>
            <h2 className={`${displayTitle} mt-4`}>พื้นที่เล็ก ๆ ที่ตั้งใจให้คุณได้พักจริง</h2>
            <p className={`${bodyText} mt-5 max-w-xl`}>
              เราเชื่อว่าการสระผมที่ดีไม่ใช่แค่ความสะอาด แต่คือช่วงเวลาที่คุณได้หยุดคิด หยุดรีบ และรู้สึกว่ามีคนดูแลอยู่ นั่นคือสิ่งที่เราตั้งใจสร้างในทุกการนัดหมาย
            </p>
          </Reveal>

          <ol className="mt-10 divide-y divide-stone-200 border-y border-stone-200">
            {PRINCIPLES.map((p, i) => (
              <Reveal as="li" key={p.title} delay={i * 80} className="grid grid-cols-[3rem_1fr] gap-x-4 py-5 sm:grid-cols-[4rem_1fr]">
                <span className="font-display text-3xl leading-none text-olive-400">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-serifth text-lg text-bark-900">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-bark-600">{p.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
