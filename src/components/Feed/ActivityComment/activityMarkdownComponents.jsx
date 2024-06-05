import ActivityCheckbox from '../ActivityCheckbox/ActivityCheckbox'
import ActivityReference from '../ActivityReference/ActivityReference'

const allowedRefTypes = [
  'user',
  'task',
  'folder',
  'version',
  'representation',
  'workfile',
  'product',
]
const sanitizeURL = (url = '') => {
  // ensure that the url is valid https url
  // or a valid {type}:{id} reference
  if (url.startsWith('https://')) return { url, type: 'url' }
  if (url.includes(':')) {
    const sections = url.split(':')
    const [type, id] = sections
    if (allowedRefTypes.includes(type) && id && sections.length === 2) return { type, id }
  }
  return {}
}

export const aTag = (
  { children, href },
  { entityId, projectName, onReferenceClick, activityId, onReferenceTooltip },
) => {
  const { url, type, id } = sanitizeURL(href)

  // return regular url
  // if no reference type, return regular link with no href
  if (url || !type || !id) {
    return (
      <a href={url} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

  const label = children && children.replace('@', '')
  // is this ref the same as the current task id
  const isEntity = id === entityId

  return (
    <ActivityReference
      {...{ type, id }}
      variant={isEntity ? 'filled' : 'primary'}
      onClick={() =>
        type !== 'user' &&
        onReferenceClick({ entityId: id, entityType: type, projectName, activityId })
      }
      onMouseEnter={(e, pos) => onReferenceTooltip({ type, id, label, name: id, pos })}
    >
      {label}
    </ActivityReference>
  )
}

export const inputTag = ({ type, checked, ...props }, { activity, onCheckChange }) => {
  if (type === 'checkbox') {
    return (
      <ActivityCheckbox
        checked={checked}
        onChange={(e) => onCheckChange && onCheckChange(e, activity)}
      />
    )
  } else {
    return <input type={type} disabled {...props} />
  }
}

import { BlockCode } from './ActivityComment.styled'
// eslint-disable-next-line
export const codeTag = ({ node, className, children }) => {
  return <BlockCode>{children}</BlockCode>
}
