import { useEffect, useRef, useState } from 'react'
import ActivityReferenceTooltip from '../ActivityReferenceTooltip/ActivityReferenceTooltip'
import * as Styled from './ActivityReference.styled'
import { Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'
import getEntityTypeIcon from '/src/helpers/getEntityTypeIcon'

// variants = filled, text

const ActivityReference = ({
  id,
  type,
  variant = 'surface',
  label,
  name,
  isEntity,
  disabled,
  projectName,
  projectInfo,
  onClick,
  ...props
}) => {
  const icon = type === 'user' ? 'alternate_email' : getEntityTypeIcon(type, 'link')
  const [refHover, setRefHover] = useState(false)
  const [referenceCenterPos, setReferenceCenterPos] = useState(null)

  const ref = useRef(null)

  //   find the center of the reference
  useEffect(() => {
    if (!ref.current) return
    const { x, y, width } = ref.current.getBoundingClientRect()

    setReferenceCenterPos({ left: x + width / 2, top: y })
  }, [ref.current, refHover])

  const handleClick = () => {
    onClick && onClick()
    // close hover
    setRefHover(false)
  }

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
        onClick={handleClick}
        className={classNames({ disabled, isEntity }, 'reference')}
      >
        <Icon icon={icon} />
        {props.children}
      </Styled.Reference>
      {refHover && (
        <ActivityReferenceTooltip
          pos={referenceCenterPos}
          {...{ type, id, label, name, projectName, projectInfo }}
        />
      )}
    </>
  )
}

export default ActivityReference
