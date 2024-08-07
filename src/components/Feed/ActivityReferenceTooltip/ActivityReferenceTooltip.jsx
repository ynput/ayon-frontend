import { createPortal } from 'react-dom'
import EntityTooltip from '../../Tooltips/EntityTooltip/EntityTooltip'
import UserTooltip from '../../Tooltips/UserTooltip/UserTooltip'
import useReferenceTooltip from '@containers/Feed/hooks/useReferenceTooltip'
import { useEffect } from 'react'

const ActivityReferenceTooltip = ({ dispatch, ...props }) => {
  const [refTooltip = {}, setRefTooltip] = useReferenceTooltip({ dispatch })
  const { type, label, name, pos, id } = refTooltip
  const feedList = document.querySelector('.feed ul')

  useEffect(() => {
    if (id) {
      const handleMouseOver = (event) => {
        const target = event.target
        const closestRef = target?.closest(`#ref-${id.replaceAll('.', '-')}`)
        if (!closestRef) {
          // close
          setRefTooltip(null)
          document.removeEventListener('mouseover', handleMouseOver)
          if (feedList) feedList.removeEventListener('scroll', handleMouseOver)
        }
      }

      document.addEventListener('mouseover', handleMouseOver)
      // scroll event
      if (feedList) feedList.addEventListener('scroll', handleMouseOver)

      // cleanup
      return () => {
        document.removeEventListener('mouseover', handleMouseOver)
        if (feedList) feedList.removeEventListener('scroll', handleMouseOver)
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
