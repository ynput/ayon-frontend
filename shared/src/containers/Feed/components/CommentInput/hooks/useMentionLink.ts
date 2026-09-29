import { useEffect, useRef } from 'react'
import { Quill } from 'react-quill-ayon'
import useReferenceTooltip from '../../../hooks/useReferenceTooltip'
import { useDetailsPanelContext } from '@shared/context/DetailsPanelContext'
import type { DetailsPanelEntityType } from '@shared/api'

const Inline = Quill.import('blots/inline')

interface MentionLinkOptions {
  projectName: string
  // ReactQuill ref of the editor these mention links belong to
  editorRef: React.RefObject<any>
}

type MentionHandlers = {
  onClick: (type: string, id: string) => void
  onHover: (type: string, id: string, target: HTMLElement) => void
}

// Handlers of each mounted editor, keyed by its quill root element.
// The blot is registered globally, so it resolves the editor that owns the clicked node at event time.
const handlersByEditor = new WeakMap<Element, { current: MentionHandlers }>()
// Used for mention nodes that are not inside a known editor
let lastHandlers: { current: MentionHandlers } | null = null

const getHandlers = (node: HTMLElement): MentionHandlers | undefined => {
  const root = node.closest('.ql-editor')
  return ((root && handlersByEditor.get(root)) || lastHandlers)?.current
}

// special link for mentions
// @ts-ignore
class MentionLink extends Inline {
  static blotName = 'mention'
  static tagName = 'MENTION'
  // @ts-ignore
  static create(value) {
    if (!value || typeof value !== 'string') return document.createElement(MentionLink.tagName)

    const node = super.create(value)
    // check if this is a mention url
    const valueMentionType = value.split(':').shift() as string
    const valueMentionId = value.split(':').pop() as string

    node.classList.add('mention')
    node.classList.add(valueMentionType)
    // add id=id-ref
    node.setAttribute('id', `ref-${valueMentionId}`)
    //   set as not editable
    node.setAttribute('contenteditable', 'false')

    // add data-value attribute
    node.setAttribute('data-value', value)

    //   on mouse click open reference
    node.addEventListener('click', (e: MouseEvent) => {
      e.preventDefault()
      if (valueMentionType === 'user') return

      getHandlers(node)?.onClick(valueMentionType, valueMentionId)
    })

    // add on mouse enter
    node.addEventListener('mouseenter', (e: MouseEvent) => {
      const target = (e.target || node) as HTMLElement
      getHandlers(node)?.onHover(valueMentionType, valueMentionId, target)
    })

    return node || ''
  }

  // Added value method to retrieve the value from the DOM node
  static value(node: any) {
    return node.getAttribute('data-value')
  }
}

// @ts-ignore
MentionLink.sanitize = (url) => url
// @ts-ignore
Quill.register(MentionLink, true)

// custom mention links
const useMentionLink = ({ projectName, editorRef }: MentionLinkOptions) => {
  const { openSlideOut } = useDetailsPanelContext()
  const [, setRefTooltip] = useReferenceTooltip()

  const handlersRef = useRef<MentionHandlers>(null as unknown as MentionHandlers)
  // keep the latest project and callbacks for this editor
  handlersRef.current = {
    onClick: (type, id) => {
      openSlideOut({
        entityId: id,
        entityType: type as DetailsPanelEntityType,
        projectName,
      })
    },
    onHover: (type, id, target) => {
      const label = target.innerText.replace('@', '')
      // get the center of the reference
      const { x, y, width } = target.getBoundingClientRect()
      const pos = { left: x + width / 2, top: y }

      setRefTooltip({
        id,
        name: id,
        type,
        label,
        pos,
      })
    },
  }

  // link this editor's root to its handlers (the editor can be (re)mounted conditionally)
  useEffect(() => {
    lastHandlers = handlersRef
    const root = editorRef.current?.getEditor?.()?.root
    if (root) handlersByEditor.set(root, handlersRef)
  })

  useEffect(() => {
    return () => {
      if (lastHandlers === handlersRef) lastHandlers = null
    }
  }, [])
}

export default useMentionLink
