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

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
// import supported languages
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python'
import cpp from 'react-syntax-highlighter/dist/esm/languages/hljs/cpp'
import java from 'react-syntax-highlighter/dist/esm/languages/hljs/java'
import css from 'react-syntax-highlighter/dist/esm/languages/hljs/css'

// register
SyntaxHighlighter.registerLanguage('javascript', js)
SyntaxHighlighter.registerLanguage('python', python)
SyntaxHighlighter.registerLanguage('cpp', cpp)
SyntaxHighlighter.registerLanguage('java', java)
SyntaxHighlighter.registerLanguage('css', css)

import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { InlineCode } from './ActivityComment.styled'
// eslint-disable-next-line
export const codeTag = ({ node, inline, className, children, ...props }) => {
  const matches = /language-(\w+)/.exec(className || '') || []
  let match = matches[1]
  // if there is no language provided, check number of lines
  if (!match) {
    const lines = children.split('\n').length
    if (lines > 1) match = 'text'
  }

  const customTheme = {
    ...a11yDark,
    hljs: {
      ...a11yDark.hljs,
      background: 'var(--md-sys-color-surface-container-lowest)',
      borderRadius: 'var(--padding-s)',
    },
    'hljs-variable': {
      color: '#ffa07a',
    },
    'hljs-template-variable': {
      color: '#ffa07a',
    },
    'hljs-tag': {
      color: '#ffa07a',
    },
    'hljs-name': {
      color: '#ffa07a',
    },
    'hljs-selector-id': {
      color: '#ffa07a',
    },
    'hljs-selector-class': {
      color: '#ffa07a',
    },
    'hljs-regexp': {
      color: '#ffa07a',
    },
    'hljs-deletion': {
      color: '#ffa07a',
    },
  }

  return !inline && match ? (
    <SyntaxHighlighter style={customTheme} PreTag="div" language={match} {...props} wrapLongLines>
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <InlineCode className={className} {...props}>
      {children}
    </InlineCode>
  )
}
