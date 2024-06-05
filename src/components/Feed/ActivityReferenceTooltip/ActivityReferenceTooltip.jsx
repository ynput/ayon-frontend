import { createPortal } from 'react-dom'
import EntityTooltip from '../../Tooltips/EntityTooltip/EntityTooltip'
import UserTooltip from '../../Tooltips/UserTooltip/UserTooltip'
import useReferenceTooltip from '/src/containers/Feed/hooks/useReferenceTooltip'
import { useEffect } from 'react'

const ActivityReferenceTooltip = ({ dispatch, ...props }) => {
  const [refTooltip = {}, setRefTooltip] = useReferenceTooltip({ dispatch })
  const { type, label, name, pos, id } = refTooltip

  useEffect(() => {
    if (id) {
      const handleMouseOver = (event) => {
        const hoveredElement = document.elementFromPoint(event.clientX, event.clientY)
        const closestRef = hoveredElement.closest(`#${id}-ref`)
        if (!closestRef) {
          // close
          setRefTooltip(null)
          document.removeEventListener('mouseover', handleMouseOver)
        }
      }

      document.addEventListener('mouseover', handleMouseOver)

      return () => {
        document.removeEventListener('mouseover', handleMouseOver)
      }
    }
  }, [id, dispatch])

  if (!id) return

  return createPortal(
    type === 'user' ? (
      <UserTooltip name={name} label={label} pos={pos} />
    ) : (
      <EntityTooltip {...{ type, label, name, pos, id, ...props }} />
    ),
    document.body,
  )
}

export default ActivityReferenceTooltip
