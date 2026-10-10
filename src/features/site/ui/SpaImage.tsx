import { useState } from 'react'
import { Leaf } from 'lucide-react'
import { cn } from '@/lib/format'
import { imageUrl, type ImageKey } from '../content/images'

interface Props {
  image: ImageKey
  alt: string
  width?: number
  className?: string
  imgClassName?: string
  priority?: boolean
}

/** รูปที่ค่อย ๆ ปรากฏเมื่อโหลดเสร็จ และมีพื้นหลังสำรองเมื่อโหลดไม่ได้ */
export function SpaImage({ image, alt, width = 1200, className, imgClassName, priority }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading')
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-cream via-stone-100 to-sage-100', className)}>
      {state === 'failed' ? (
        <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center text-sage-400">
          <Leaf size={36} strokeWidth={1.25} />
        </div>
      ) : (
        <img
          src={imageUrl(image, width)}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          className={cn('h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out', state === 'ready' ? 'opacity-100' : 'opacity-0', imgClassName)}
        />
      )}
    </div>
  )
}
