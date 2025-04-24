import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import useReferenceTooltip from '../../hooks/useReferenceTooltip'
import UserTooltip from '../Tooltips/UserTooltip/UserTooltip'
import EntityTooltip from '../Tooltips/EntityTooltip/EntityTooltip'

interface ActivityReferenceTooltipProps {}

const ActivityReferenceTooltip: React.FC<ActivityReferenceTooltipProps> = () => {
  const [refTooltip, setRefTooltip] = useReferenceTooltip()
  const { type, label, name, pos, id } = refTooltip || {}
  const feedList = document.querySelector('.feed ul')

  useEffect(() => {
    if (id) {
      const handleMouseOver = (event: MouseEvent) => {
        const target = event.target as Element | null
        const closestRef = target?.closest(`#ref-${id.replaceAll('.', '-')}`)
        if (!closestRef) {
          // close
          setRefTooltip(null)
          document.removeEventListener('mouseover', handleMouseOver)
          if (feedList) feedList.removeEventListener('scroll', handleMouseOver as EventListener)
        }
      }

      document.addEventListener('mouseover', handleMouseOver)
      // scroll event
      if (feedList) feedList.addEventListener('scroll', handleMouseOver as EventListener)

      // cleanup
      return () => {
        document.removeEventListener('mouseover', handleMouseOver)
        if (feedList) feedList.removeEventListener('scroll', handleMouseOver as EventListener)
      }
    }
  }, [id, setRefTooltip, feedList])

  if (!id) return null

  return createPortal(
    type === 'user' && pos ? (
      <UserTooltip name={name} label={label} pos={pos} />
    ) : (
      <EntityTooltip {...{ type, label, name, pos, id }} />
    ),
    document.body,
  )
}

export default ActivityReferenceTooltip
