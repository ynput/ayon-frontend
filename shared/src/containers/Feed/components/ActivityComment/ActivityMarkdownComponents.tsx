import React from 'react'
import { isArray } from 'lodash'
import ActivityCheckbox from '../ActivityCheckbox/ActivityCheckbox'
import ActivityReference from '../ActivityReference/ActivityReference'
import { ACTIVITY_LINK_LABEL, parseActivityLink } from '@shared/components/MarkdownEditor'

export const allowedRefTypes = [
  'user',
  'team',
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
    if (allowedRefTypes.includes(type) && id && sections.length === 2) {
      const decodedId = (() => {
        try {
          return decodeURIComponent(id)
        } catch {
          return id
        }
      })()
      return { type, id: decodedId }
    }
  }
  return {}
}

interface ATagProps {
  children: React.ReactNode
  href: string
}

interface ATagOptions {
  entityId?: string
  projectName?: string
  userName?: string
  userTeamNames?: string[]
  onReferenceClick: (data: {
    entityId: string
    entityType: string
    projectName?: string
    activityId: string
  }) => void
  activityId: string
  onReferenceTooltip: (data: {
    type: string
    id: string
    label: string
    name: string
    pos: any
  }) => void
  categoryPrimary?: string
  categorySecondary?: string
  // a link to a comment was clicked, defaults to opening the link
  onActivityLinkClick?: (link: { activityId: string; projectName: string; url: string }) => void
}

const getText = (children: React.ReactNode): string =>
  React.Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')

export const aTag = (
  { children, href }: ATagProps,
  {
    entityId,
    userName,
    userTeamNames,
    projectName,
    onReferenceClick,
    activityId,
    onReferenceTooltip,
    categoryPrimary,
    categorySecondary,
    onActivityLinkClick,
  }: ATagOptions,
): React.ReactNode => {
  // a link to a comment is a chip like mentions
  const activityLink = parseActivityLink(href)
  if (activityLink) {
    const text = getText(children).trim()
    // a pasted url has itself as its label
    const label = !text || /^https?:\/\//.test(text) ? ACTIVITY_LINK_LABEL : text
    const link = { ...activityLink, url: href }
    return (
      <ActivityReference
        type="activity"
        id={`activity-${activityLink.activityId}`}
        icon="chat"
        onClick={() =>
          onActivityLinkClick
            ? onActivityLinkClick(link)
            : window.open(href, '_blank', 'noreferrer')
        }
        categoryPrimary={categoryPrimary}
        categorySecondary={categorySecondary}
        data-tooltip="Go to comment"
      >
        {label}
      </ActivityReference>
    )
  }

  const { url, type, id } = sanitizeURL(href)

  // link is broken in some way
  if (!url && !type && !id) {
    return children
  }

  // return regular url
  // if no reference type, return regular link with no href
  if (url || !type || !id) {
    if (type === 'relative' && url) {
      return <Link to={url}>{children}</Link>
    } else {
      return (
        <a href={url} target="_blank" rel="noreferrer">
          {children}
        </a>
      )
    }
  }

  const label = (children && children.toString().replace('@', '')) || ''
  // is this ref the same as the current task id, the user is mentioning themselves,
  // or the current user is a member of the mentioned team
  const isHighlighted =
    id === entityId ||
    (type === 'user' && id === userName) ||
    (type === 'team' && !!userTeamNames?.includes(id))
  // create a DOM-safe id (no dots or spaces) for the element attribute and selector matching
  const domSafeId = id.replaceAll('.', '-').replaceAll(' ', '-')

  return (
    <ActivityReference
      {...{ type, id: domSafeId }}
      variant={isHighlighted ? 'filled' : 'surface'}
      onClick={() => {
        if (type !== 'user' && type !== 'team') {
          onReferenceClick({ entityId: id, entityType: type, projectName, activityId })
        }
      }}
      onMouseEnter={(e, pos) => onReferenceTooltip({ type, id: domSafeId, label, name: id, pos })}
      categoryPrimary={categoryPrimary}
      categorySecondary={categorySecondary}
      data-mention-value={`${type}:${id}`}
      data-mention-label={label}
    >
      {label}
    </ActivityReference>
  )
}

interface InputTagProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type: string
  checked?: boolean
}

interface InputTagOptions {
  activity: any
  onCheckChange?: (event: React.ChangeEvent<HTMLInputElement>, activity: any) => void
}

export const inputTag = (
  { type, checked, ...props }: InputTagProps,
  { activity, onCheckChange }: InputTagOptions,
): JSX.Element => {
  if (type === 'checkbox') {
    return (
      <ActivityCheckbox
        checked={!!checked}
        onChange={(e) => onCheckChange && onCheckChange(e, activity)}
      />
    )
  } else {
    return <input type={type} disabled {...props} />
  }
}

import { BlockCode, InlineCode, QuoteLine } from './ActivityComment.styled'
import { highlightCode } from '@shared/components/MarkdownEditor/code/prism'
import { Link } from 'react-router-dom'
// eslint-disable-next-line
interface CodeTagProps {
  node: any
  className?: string
  children: React.ReactNode
}

export const codeTag = ({ node, className, children }: CodeTagProps): JSX.Element => {
  // fenced blocks span several lines (or have a language), everything else is inline `code`
  const isBlock =
    !!className?.startsWith('language-') ||
    (node?.position && node.position.start.line !== node.position.end.line)
  if (!isBlock) return <InlineCode>{children}</InlineCode>

  // syntax highlighting with the same prism setup as the editor
  const language = className?.replace(/^language-/, '')
  const code = typeof children === 'string' ? children.replace(/\n$/, '') : null
  const html = code !== null ? highlightCode(code, language) : null
  if (html !== null) {
    return (
      <BlockCode>
        <code className={className} dangerouslySetInnerHTML={{ __html: html }} />
      </BlockCode>
    )
  }
  return <BlockCode>{children}</BlockCode>
}

interface BlockquoteTagProps {
  children: React.ReactNode
}

export const blockquoteTag = ({ children }: BlockquoteTagProps): JSX.Element => {
  // get children string
  // children is a single node (or nothing) for a quote with one child, not always an array
  const child = (React.Children.toArray(children) as any[]).find((item) => !!item?.props)?.props
    ?.children

  if (!child) return <blockquote>{children}</blockquote>

  // now split by new lines
  const lines: JSX.Element[] = []
  if (typeof child === 'string') {
    // split by new lines
    const stringLines = child.split('\n')
    stringLines.forEach((line, i) => {
      lines.push(<QuoteLine key={i}>{line}</QuoteLine>)
    })
  } else if (isArray(child)) {
    const splitLines: any = []
    let index = 0
    ;(child as any).forEach((line: any) => {
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

    splitLines.forEach((line: any, i: number) => {
      lines.push(<QuoteLine key={i}>{line}</QuoteLine>)
    })
  }

  return <blockquote>{lines}</blockquote>
}
