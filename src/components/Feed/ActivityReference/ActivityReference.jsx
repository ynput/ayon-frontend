import { useEffect, useRef, useState } from 'react'
import FeedReferencePopup from '../ActivityReferenceTooltip/ActivityReferenceTooltip'
import * as Styled from './ActivityReference.styled'
import { Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'

const typeIcons = {
  user: 'alternate_email',
  version: 'layers',
  task: 'check_circle',
}
// variants = filled, text

const ActivityReference = ({ id, type, variant = 'surface', label, disabled, ...props }) => {
  const icon = typeIcons[type] || 'link'
  const [refHover, setRefHover] = useState(false)
  const [referenceCenterPos, setReferenceCenterPos] = useState(null)

  const ref = useRef(null)

  //   find the center of the reference
  useEffect(() => {
    if (!ref.current) return
    const { x, y, width } = ref.current.getBoundingClientRect()
    setReferenceCenterPos({ left: x + width / 2, top: y })
  }, [ref.current, refHover])

  return (
    <>
      <Styled.Reference
        {...props}
        variant={variant}
        icon={icon}
        $variant={variant}
        ref={ref}
        onMouseEnter={() => !disabled && setRefHover(true)}
        onMouseLeave={() => setRefHover(false)}
        className={classNames({ disabled })}
      >
        <Icon icon={icon} />
        {props.children}
      </Styled.Reference>
      {refHover && (
        <FeedReferencePopup type={type} id={id} pos={referenceCenterPos} label={label} />
      )}
    </>
  )
}

export default ActivityReference
