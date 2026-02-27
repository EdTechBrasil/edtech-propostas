import { GripVertical } from 'lucide-react'
import { forwardRef } from 'react'

type DragHandleProps = React.HTMLAttributes<HTMLButtonElement>

export const DragHandle = forwardRef<HTMLButtonElement, DragHandleProps>(
  ({ className = '', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="Arrastar para reordenar"
      className={`cursor-grab active:cursor-grabbing touch-none text-slate-300 hover:text-slate-500 transition-colors ${className}`}
      {...props}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  )
)

DragHandle.displayName = 'DragHandle'
