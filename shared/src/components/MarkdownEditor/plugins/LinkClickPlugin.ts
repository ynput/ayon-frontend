import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { parseActivityLink } from '../links/activityLinks'

/**
 * Open links in a new tab: with a plain click when read only, with mod+click while editing
 * (a plain click places the caret).
 */
const LinkClickPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest?.(
        'a[href]',
      ) as HTMLAnchorElement | null
      if (!link || link.hasAttribute('data-mention-value')) return
      const isEditable = editor.isEditable()
      if (isEditable && !(e.metaKey || e.ctrlKey)) return
      e.preventDefault()
      e.stopPropagation()
      const activityLink = parseActivityLink(link.getAttribute('href'))
      if (activityLink?.isSource) return
      window.open(activityLink?.url ?? link.href, '_blank', 'noopener,noreferrer')
    }

    let currentRoot: HTMLElement | null = null
    const unregister = editor.registerRootListener((root, prevRoot) => {
      prevRoot?.removeEventListener('click', onClick)
      root?.addEventListener('click', onClick)
      currentRoot = root
    })
    return () => {
      unregister()
      currentRoot?.removeEventListener('click', onClick)
    }
  }, [editor])

  return null
}

export default LinkClickPlugin
