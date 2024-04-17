import { useEffect, useRef, useState } from 'react'
import ActivityReferenceTooltip from '../ActivityReferenceTooltip/ActivityReferenceTooltip'
import * as Styled from './ActivityReference.styled'
import { Icon } from '@ynput/ayon-react-components'
import { classNames } from 'primereact/utils'

const typeIcons = {
  user: 'alternate_email',
  version: 'layers',
  task: 'check_circle',
}
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
  ...props
}) => {
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
