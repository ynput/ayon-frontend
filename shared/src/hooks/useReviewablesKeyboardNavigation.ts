import { useEffect } from 'react'
import { isHTMLElement } from '@shared/util'

type ReviewableLike = {
  fileId: string
  label?: string | null
}

type Options<T extends ReviewableLike> = {
  reviewables: T[]
  selected: string[]
  onChange?: (fileId: string) => void
  onNavigate?: (item: T) => void
  enabled?: boolean
}

const NAV_KEYS = ['w', 's', 'ArrowUp', 'ArrowDown']

export function useReviewablesKeyboardNavigation<T extends ReviewableLike>({
  reviewables,
  selected,
  onChange,
  onNavigate,
  enabled = true,
}: Options<T>) {
  useEffect(() => {
    if (!enabled || reviewables.length <= 1) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!NAV_KEYS.includes(e.key)) return

      if (isHTMLElement(e.target)) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
        if (e.target.isContentEditable) return
      }

      const currentIndex = reviewables.findIndex(({ fileId }) => selected.includes(fileId))
      const delta = e.key === 'w' || e.key === 'ArrowUp' ? -1 : 1
      const nextIndex = currentIndex + delta
      const next =
        reviewables[nextIndex < 0 ? reviewables.length - 1 : nextIndex % reviewables.length]
      if (!next) return

      onChange?.(next.fileId)
      onNavigate?.(next)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, reviewables, selected, onChange, onNavigate])
}
