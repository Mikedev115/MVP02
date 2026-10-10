import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { EmptyState } from '@/components/ui/Misc'

export function NotFound() {
  return (
    <EmptyState
      icon={<SearchX size={22} />}
      title="ไม่พบหน้าที่ต้องการ"
      description="ลิงก์นี้อาจไม่ถูกต้อง ลองกลับไปที่หน้าภาพรวม"
      action={<Link to="/" className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-medium text-white hover:bg-sage-700">กลับหน้าภาพรวม</Link>}
    />
  )
}
