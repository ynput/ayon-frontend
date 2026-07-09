import { Icon } from '@ynput/ayon-react-components'
import { FC, useEffect, useRef } from 'react'
import styled from 'styled-components'

const LoadMoreCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: var(--base-gap-large);
`

interface LoadMoreTasksRowProps {
  message: string
  onLoadMore?: () => void
}

const LoadMoreTasksRow: FC<LoadMoreTasksRowProps> = ({ message, onLoadMore }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  const hasFiredRef = useRef(false)

  // Update the ref whenever onLoadMore changes
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const TIMER_DELAY = 1200 // Delay in milliseconds before triggering onLoadMore

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          // Start timer if visible and hasn't fired for this visibility session
          if (!timerRef.current && !hasFiredRef.current) {
            timerRef.current = setTimeout(() => {
              onLoadMoreRef.current?.()
              hasFiredRef.current = true
              timerRef.current = null
            }, TIMER_DELAY)
          }
        } else {
          // Clear timer if no longer visible
          if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
          }
          // Reset fired flag when it leaves view
          hasFiredRef.current = false
        }
      },
      { threshold: 0.5, rootMargin: '0px' }, // Trigger when 50% of the element is visible,
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, []) // No dependencies, use refs for logic

  return (
    <LoadMoreCell ref={containerRef}>
      <Icon icon="add" /> {message}
    </LoadMoreCell>
  )
}

export default LoadMoreTasksRow
