import { useEffect, useRef, useState } from 'react'
import FeedReferencePopup from '../FeedReferencePopup/FeedReferencePopup'
import * as Styled from './FeedReference.styled'
import { Icon } from '@ynput/ayon-react-components'

const typeIcons = {
  user: 'alternate_email',
  version: 'layers',
  task: 'check_circle',
}
// variants = filled, text

const FeedReference = ({ id, type, variant = 'surface', label, ...props }) => {
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
        onMouseEnter={() => setRefHover(true)}
        onMouseLeave={() => setRefHover(false)}
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

export default FeedReference
