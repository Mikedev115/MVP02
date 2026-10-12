import type { L } from '@/i18n/types'

export interface Review {
  id: string
  name: L
  /** ตัวอักษรในวงกลมอวาตาร์ */
  initial: L
  context: L
  text: L
}

/** รีวิวตัวอย่างที่เขียนขึ้นเพื่อสาธิต — ไม่ใช่ความเห็นจากลูกค้าจริง */
export const REVIEWS: Review[] = [
  {
    id: 'rv-1',
    name: { th: 'คุณตัวอย่าง ก.', en: 'Sample Guest A.' },
    initial: { th: 'ก', en: 'A' },
    context: { th: 'สระผมสไตล์เวียดนาม', en: 'Vietnamese-Style Hair Wash' },
    text: {
      th: 'เข้ามาตอนหัวหนักมาก ออกไปเบาจริง ๆ นวดหนังศีรษะพอดี ไม่แรงไป หลับไปครึ่งชั่วโมงโดยไม่รู้ตัว',
      en: 'I came in with a heavy head and left feeling light. The scalp massage was just right, never too hard. I fell asleep for half an hour without noticing.',
    },
  },
  {
    id: 'rv-2',
    name: { th: 'คุณตัวอย่าง ข.', en: 'Sample Guest B.' },
    initial: { th: 'ข', en: 'B' },
    context: { th: 'Zen Head Spa', en: 'Zen Head Spa' },
    text: {
      th: 'บรรยากาศเงียบและกลิ่นหอมอ่อน ๆ ทำให้หยุดคิดเรื่องงานได้จริง พนักงานถามความชอบก่อนเริ่มทุกครั้ง',
      en: 'The quiet and the soft scent really let me stop thinking about work. The staff always ask about your preferences before they begin.',
    },
  },
  {
    id: 'rv-3',
    name: { th: 'คุณตัวอย่าง ค.', en: 'Sample Guest C.' },
    initial: { th: 'ค', en: 'C' },
    context: { th: 'แพ็กเกจคลายเครียด', en: 'Stress Relief Package' },
    text: {
      th: 'นั่งทำงานหน้าจอทั้งวัน บ่าแข็งมาก แพ็กเกจนี้ช่วยให้ไหล่โล่งขึ้น จองง่าย เลือกเวลาได้เองสะดวกดี',
      en: 'I sit at a screen all day and my shoulders were rock hard. This package loosened them up. Booking was easy and I could pick my own time.',
    },
  },
  {
    id: 'rv-4',
    name: { th: 'คุณตัวอย่าง ง.', en: 'Sample Guest D.' },
    initial: { th: 'ง', en: 'D' },
    context: { th: 'แพ็กเกจคู่', en: 'Couple Package' },
    text: {
      th: 'มากับเพื่อนสนิท เตียงคู่ทำให้ได้พักพร้อมกัน บรรยากาศส่วนตัว สบายใจ และห้องสะอาดมาก',
      en: 'I came with a close friend. The twin bed let us rest side by side. It felt private and comfortable, and the room was spotless.',
    },
  },
  {
    id: 'rv-5',
    name: { th: 'คุณตัวอย่าง จ.', en: 'Sample Guest E.' },
    initial: { th: 'จ', en: 'E' },
    context: { th: 'Scalp Detox', en: 'Scalp Detox' },
    text: {
      th: 'หนังศีรษะเคยมันและคัน หลังทรีตเมนต์รู้สึกสะอาดโล่ง ช่างอธิบายขั้นตอนเข้าใจง่าย',
      en: 'My scalp used to be oily and itchy. After the treatment it felt clean and clear, and the therapist explained each step simply.',
    },
  },
]
