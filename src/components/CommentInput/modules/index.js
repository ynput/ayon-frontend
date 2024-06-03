import { Quill } from 'react-quill-ayon'
import MagicUrl from 'quill-magic-url'
import ImageUploader from './ImageUploader'
import { mentionTypeOptions } from '../CommentInput'
Quill.register('modules/imageUploader', ImageUploader)
Quill.register('modules/magicUrl', MagicUrl)

// custom links
const Inline = Quill.import('blots/inline')

// special link for mentions
class MentionLink extends Inline {
  static blotName = 'mention'
  static tagName = 'A'
  static create(value) {
    const node = super.create(value)
    // check if this is a mention url
    const mentionIds = Object.values(mentionTypeOptions).map((option) => option.id)
    const valueMentionId = value.split(':').shift()

    if (mentionIds.includes(valueMentionId)) {
      node.classList.add('mention')
      node.classList.add(valueMentionId)

      // add data-value attribute
      node.setAttribute('data-value', value)
      // set href value
      node.setAttribute('href', value)

      // add on click event
      node.addEventListener('click', (e) => {
        e.preventDefault()
        console.log(e)
      })
    }

    return node
  }
}
MentionLink.sanitize = (url) => url
Quill.register(MentionLink, true)

// override icons with material icons
const getIcon = (icon) => '<span class="material-symbols-outlined icon">' + icon + '</span>'

var icons = Quill.import('ui/icons')
icons['header']['2'] = getIcon('format_h1')
icons['bold'] = getIcon('format_bold')
icons['italic'] = getIcon('format_italic')
icons['underline'] = getIcon('format_underlined')
icons['link'] = getIcon('link')
icons['list']['ordered'] = getIcon('format_list_numbered')
icons['list']['bullet'] = getIcon('format_list_bulleted')
icons['list']['check'] = getIcon('checklist')
icons['image'] = getIcon('attach_file')
icons['code-block'] = getIcon('code')

export const quillFormats = [
  'header',
  'bold',
  'italic',
  'strike',
  'list',
  'link',
  'code-block',
  'mention',
]

export const getModules = ({ imageUploader }) => {
  return {
    toolbar: [
      [{ header: 2 }, 'bold', 'italic', 'link', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      ['image'],
    ],
    imageUploader,
    magicUrl: true,
    mentionSelect: {},
  }
}
