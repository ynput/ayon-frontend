import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import { $isLinkNode, AutoLinkNode, LinkNode } from '@lexical/link'
import { mergeRegister } from '@lexical/utils'
import { parseActivityLink } from '../links/activityLinks'

// Links to comments are shown as a chip, like mentions (see links/activityLinks.ts)
const ActivityLinkPlugin = () => {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const onMutation = (mutations: Map<string, string>) => {
      editor.getEditorState().read(() => {
        for (const [key, mutation] of mutations) {
          if (mutation === 'destroyed') continue
          const node = $getNodeByKey(key)
          const dom = editor.getElementByKey(key)
          if (!dom || !$isLinkNode(node)) continue
          const link = parseActivityLink(node.getURL())
          dom.classList.toggle('md-activity-link', !!link)
        }
      })
    }
    return mergeRegister(
      editor.registerMutationListener(LinkNode, onMutation, { skipInitialization: false }),
      editor.registerMutationListener(AutoLinkNode, onMutation, { skipInitialization: false }),
    )
  }, [editor])

  return null
}

export default ActivityLinkPlugin
