import { Quill } from 'react-quill-ayon'
import useReferenceTooltip from '../../../hooks/useReferenceTooltip'
import { useDetailsPanelContext } from '@shared/context'
import { DetailsPanelEntityType } from '@shared/api'

const Inline = Quill.import('blots/inline')

interface MentionLinkOptions {
  projectName: string
}

// custom mention links
const useMentionLink = ({ projectName }: MentionLinkOptions) => {
  const { openSlideOut } = useDetailsPanelContext()
  const [, setRefTooltip] = useReferenceTooltip()

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
      node.addEventListener('click', (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        if (valueMentionType === 'user') return

        openSlideOut({
          entityId: valueMentionId,
          entityType: valueMentionType as DetailsPanelEntityType,
          projectName,
        })
      })

      // add on mouse enter
      node.addEventListener('mouseenter', (e: React.KeyboardEvent<HTMLElement>) => {
        const target = e.target || {}
        const label = (target as HTMLElement).innerText.replace('@', '')
        // get the center of the reference
        const { x, y, width } = (target as HTMLElement).getBoundingClientRect()
        const pos = { left: x + width / 2, top: y }

        setRefTooltip({
          id: valueMentionId,
          name: valueMentionId,
          type: valueMentionType,
          label,
          pos,
        })
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
}

export default useMentionLink
