import { Quill } from 'react-quill-ayon'
import useReferenceTooltip from '@containers/Feed/hooks/useReferenceTooltip'
import { useDispatch } from 'react-redux'
import { openSlideOut } from '@state/details'
const Inline = Quill.import('blots/inline')

// custom mention links
const useMentionLink = ({ projectName, projectInfo, scope }) => {
  const dispatch = useDispatch()
  const [, setRefTooltip] = useReferenceTooltip({ dispatch })

  // special link for mentions
  class MentionLink extends Inline {
    static blotName = 'mention'
    static tagName = 'MENTION'
    static create(value) {
      if (!value || typeof value !== 'string') return document.createElement(MentionLink.tagName)

      const node = super.create(value)
      // check if this is a mention url
      const valueMentionType = value.split(':').shift()
      const valueMentionId = value.split(':').pop()

      node.classList.add('mention')
      node.classList.add(valueMentionType)
      // add id=id-ref
      node.setAttribute('id', `ref-${valueMentionId}`)
      //   set as not editable
      node.setAttribute('contenteditable', 'false')

      // add data-value attribute
      node.setAttribute('data-value', value)

      //   on mouse click open reference
      node.addEventListener('click', (e) => {
        e.preventDefault()
        if (valueMentionType === 'user') return
        dispatch(
          openSlideOut({
            entityId: valueMentionId,
            entityType: valueMentionType,
            projectName,
            scope,
          }),
        )
      })

      // add on mouse enter
      node.addEventListener('mouseenter', (e) => {
        const target = e.target || {}
        const label = target.innerText.replace('@', '')
        // get the center of the reference
        const { x, y, width } = target.getBoundingClientRect()
        const pos = { left: x + width / 2, top: y }

        setRefTooltip({
          id: valueMentionId,
          name: valueMentionId,
          type: valueMentionType,
          label,
          pos,
          projectName,
          projectInfo,
        })
      })

      return node || ''
    }

    // Added value method to retrieve the value from the DOM node
    static value(node) {
      return node.getAttribute('data-value')
    }
  }

  MentionLink.sanitize = (url) => url
  Quill.register(MentionLink, true)
}

export default useMentionLink
