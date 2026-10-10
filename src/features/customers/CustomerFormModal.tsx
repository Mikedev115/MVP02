import { useState } from 'react'
import { AGE_GROUPS, SOURCE_LABEL } from '@/data/catalog'
import type { AcquisitionSource, AgeGroup, Customer } from '@/types'
import { useStore } from '@/state/store'
import { useUi } from '@/state/ui'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'

interface Props {
  open: boolean
  onClose: () => void
  /** ถ้าส่งมาจะเป็นการแก้ไขข้อมูล */
  customer?: Customer
  onSaved?: (c: Customer) => void
}

export function CustomerFormModal({ open, onClose, customer, onSaved }: Props) {
  if (!open) return null
  return <Inner key={customer?.id ?? 'new'} onClose={onClose} customer={customer} onSaved={onSaved} />
}

const PHONE_RE = /^0\d{1,2}-?\d{3}-?\d{4}$/

function Inner({ onClose, customer, onSaved }: Omit<Props, 'open'>) {
  const { data, addCustomer, updateCustomer } = useStore()
  const { toast } = useUi()
  const [name, setName] = useState(customer?.name ?? '')
  const [nickname, setNickname] = useState(customer?.nickname ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [lineId, setLineId] = useState(customer?.lineId ?? '')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>(customer?.ageGroup ?? '')
  const [source, setSource] = useState<AcquisitionSource>(customer?.source ?? 'walk_in')
  const [note, setNote] = useState(customer?.note ?? '')
  const [submitted, setSubmitted] = useState(false)

  const duplicate = data.customers.find((c) => c.id !== customer?.id && c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') && phone.trim())
  const errors = {
    name: name.trim().length < 2 ? 'กรุณากรอกชื่อ-นามสกุล (อย่างน้อย 2 ตัวอักษร)' : '',
    nickname: !nickname.trim() ? 'กรุณากรอกชื่อเล่น' : '',
    phone: !phone.trim() ? 'กรุณากรอกเบอร์โทรศัพท์' : !PHONE_RE.test(phone.trim()) ? 'รูปแบบเบอร์ไม่ถูกต้อง เช่น 081-000-1234' : duplicate ? `เบอร์นี้ถูกใช้แล้วโดย ${duplicate.name}` : '',
  }
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : '')

  const save = () => {
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    const payload = {
      name: name.trim(),
      nickname: nickname.trim(),
      phone: phone.trim(),
      lineId: lineId.trim() || undefined,
      ageGroup: ageGroup || undefined,
      source,
      note: note.trim() || undefined,
    }
    if (customer) {
      updateCustomer(customer.id, payload)
      toast('บันทึกข้อมูลลูกค้าแล้ว')
      onSaved?.({ ...customer, ...payload })
    } else {
      const res = addCustomer(payload)
      if (res.ok) {
        toast(`เพิ่มลูกค้า ${payload.nickname} เรียบร้อยแล้ว`)
        onSaved?.(res.value)
      }
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={customer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
      description="ใช้ข้อมูลสมมติเท่านั้น ไม่ต้องกรอกข้อมูลสุขภาพหรือข้อมูลส่วนตัวจริง"
      footer={
        <>
          <Button onClick={onClose}>ยกเลิก</Button>
          <Button variant="primary" onClick={save}>
            {customer ? 'บันทึก' : 'เพิ่มลูกค้า'}
          </Button>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Field label="ชื่อ-นามสกุล" required error={show('name')}>
          {(id, d) => <Input id={id} aria-describedby={d} data-autofocus invalid={Boolean(show('name'))} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สมหญิง ใจดี" />}
        </Field>
        <Field label="ชื่อเล่น" required error={show('nickname')}>
          {(id, d) => <Input id={id} aria-describedby={d} invalid={Boolean(show('nickname'))} value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="เช่น ฟ้า" />}
        </Field>
        <Field label="เบอร์โทรศัพท์" required error={show('phone')} hint="ตัวอย่าง 081-000-1234 (ใช้เบอร์สมมติ)">
          {(id, d) => <Input id={id} aria-describedby={d} type="tel" invalid={Boolean(show('phone'))} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081-000-1234" />}
        </Field>
        <Field label="LINE ID (ถ้ามี)">{(id) => <Input id={id} value={lineId} onChange={(e) => setLineId(e.target.value)} placeholder="demo_1234" />}</Field>
        <Field label="ช่วงอายุ (ไม่บังคับ)" hint="ให้ลูกค้าเป็นผู้เลือกให้เองโดยสมัครใจ">
          {(id, d) => (
            <Select id={id} aria-describedby={d} value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup | '')}>
              <option value="">ไม่ระบุ</option>
              {AGE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g} ปี
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="รู้จักร้านจากช่องทางไหน" required>
          {(id) => (
            <Select id={id} value={source} onChange={(e) => setSource(e.target.value as AcquisitionSource)}>
              {(Object.keys(SOURCE_LABEL) as AcquisitionSource[]).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABEL[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="sm:col-span-2">
          <Field label="บันทึกเพิ่มเติม" hint="เช่น เตียงที่ชอบ หรือเวลาที่สะดวก">
            {(id, d) => <Textarea id={id} aria-describedby={d} rows={2} maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </div>
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </Modal>
  )
}
