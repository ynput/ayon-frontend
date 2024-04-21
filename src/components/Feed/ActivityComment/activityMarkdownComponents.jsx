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
  { entityId, projectName, projectInfo, onReferenceClick },
) => {
  const { url, type, id } = sanitizeURL(href)

  // return regular url
  if (url) <a href={href}>{children}</a>
  // if no reference type, return regular link with no href
  if (!type || !id) return <a>{children}</a>

  const label = children && children.replace('@', '')
  // is this ref the same as the current task id
  const isEntity = id === entityId

  return (
    <ActivityReference
      name={id}
      {...{ type, id, label, projectName, projectInfo }}
      variant={isEntity ? 'filled' : 'primary'}
      onClick={() =>
        type !== 'user' && onReferenceClick({ entityId: id, entityType: type, projectName })
      }
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
