import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { parseMentionValue } from '../nodes/MentionNode'
import type { MentionEventHandlers } from '../types'

const getMention = (e: Event) => {
  const target = (e.target as HTMLElement | null)?.closest?.(
    '[data-mention-value]',
  ) as HTMLElement | null
  if (!target) return null
  const parsed = parseMentionValue(target.getAttribute('data-mention-value'))
  if (!parsed) return null
  return { target, mention: { ...parsed, label: target.getAttribute('data-mention-label') || '' } }
}

// Click and hover on mentions inside the editor (delegated from the root element)
const MentionEventsPlugin = ({ onMentionClick, onMentionHover }: MentionEventHandlers) => {
  const [editor] = useLexicalComposerContext()
  const handlers = useRef({ onMentionClick, onMentionHover })
  handlers.current = { onMentionClick, onMentionHover }

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const found = getMention(e)
      if (found) handlers.current.onMentionClick?.(found.mention, e)
    }
    const onOver = (e: MouseEvent) => {
      const found = getMention(e)
      // only when entering the mention, not when moving between its children
      if (!found || found.target.contains(e.relatedTarget as Node)) return
      handlers.current.onMentionHover?.(found.mention, found.target)
    }
    let currentRoot: HTMLElement | null = null
    const unregister = editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener('click', onClick)
      prevRoot?.removeEventListener('mouseover', onOver)
      root?.addEventListener('click', onClick)
      root?.addEventListener('mouseover', onOver)
      currentRoot = root
    })
    return () => {
      unregister()
      currentRoot?.removeEventListener('click', onClick)
      currentRoot?.removeEventListener('mouseover', onOver)
    }
  }, [editor])

  return null
}

export default MentionEventsPlugin
