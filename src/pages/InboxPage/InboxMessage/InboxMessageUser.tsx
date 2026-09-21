import { createPortal } from 'react-dom'
import { useEffect, useRef, useState, MouseEvent } from 'react'
import UserImage from '@shared/components/UserImage'
import UserTooltip from '@shared/containers/Feed/components/Tooltips/UserTooltip/UserTooltip'

const TOOLTIP_DELAY = 400

interface InboxMessageUserProps {
  userName?: string
  fullName?: string
  /** when set, the tooltip also lists the teams this user belongs to in that project */
  projectName?: string
  isPlaceholder?: boolean
}

const InboxMessageUser = ({
  userName,
  fullName,
  projectName,
  isPlaceholder,
}: InboxMessageUserProps) => {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeout.current), [])

  // the delay stops a mouse sweeping down the list from firing a teams request per row
  const handleMouseEnter = (e: MouseEvent<HTMLSpanElement>): void => {
    if (isPlaceholder || !userName) return
    const { top, left, width } = e.currentTarget.getBoundingClientRect()
    timeout.current = setTimeout(() => setPos({ top, left: left + width / 2 }), TOOLTIP_DELAY)
  }

  const handleMouseLeave = (): void => {
    clearTimeout(timeout.current)
    setPos(null)
  }

  return (
    <>
      <span onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <UserImage name={userName || ''} size={20} className={'n-shimmer'} />
      </span>
      {pos &&
        createPortal(
          <UserTooltip name={userName} label={fullName} projectName={projectName} pos={pos} />,
          document.body,
        )}
    </>
  )
}

export default InboxMessageUser
