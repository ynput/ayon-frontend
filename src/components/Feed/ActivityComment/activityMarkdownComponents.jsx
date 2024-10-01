import { isArray } from 'lodash'
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
  else if (url.startsWith('/')) return { url, type: 'relative' }
  else if (url.includes(':')) {
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

  // link is broken in some way
  if (!url && !type && !id) {
    return children
  }

  // return regular url
  // if no reference type, return regular link with no href
  if (url || !type || !id) {
    if (type === 'relative') {
      return <Link to={url}>{children}</Link>
    } else {
      return (
        <a href={url} target="_blank" rel="noreferrer">
          {children}
        </a>
      )
    }
  }

  const label = children && children.replace('@', '')
  // is this ref the same as the current task id
  const isEntity = id === entityId

  return (
    <ActivityReference
      {...{ type, id: id.replaceAll('.', '-') }}
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

import { BlockCode, QuoteLine } from './ActivityComment.styled'
import { Link } from 'react-router-dom'
// eslint-disable-next-line
export const codeTag = ({ node, className, children }) => {
  return <BlockCode>{children}</BlockCode>
}

export const blockquoteTag = ({ children }) => {
  // get children string
  const child = children.find((item) => !!item?.props)?.props?.children

  if (!child) return <blockquote>{children}</blockquote>

  // now split by new lines
  const lines = []
  if (typeof child === 'string') {
    // split by new lines
    const stringLines = child.split('\n')
    stringLines.forEach((line, i) => {
      lines.push(<QuoteLine key={i}>{line}</QuoteLine>)
    })
  } else if (isArray(child)) {
    const splitLines = []
    let index = 0
    child.forEach((line) => {
      // check index exists on lines otherwise make a new empty array
      if (!splitLines[index]) splitLines[index] = []

      if (typeof line === 'string') {
        // check for \n
        const stringLines = line.split(/(\n)/)

        stringLines.forEach((split) => {
          if (split === '\n') {
            index++
            // create new array
            splitLines[index] = []
          } else splitLines[index].push(split)
        })
      } else {
        // now add line
        splitLines[index].push(line)
      }
    })

    splitLines.forEach((line, i) => {
      lines.push(<QuoteLine key={i}>{line}</QuoteLine>)
    })
  }

  return <blockquote>{lines}</blockquote>
}
