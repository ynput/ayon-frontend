// @ts-nocheck

import { Quill } from 'react-quill-ayon'
import MagicUrl from 'quill-magic-url'
import ImageUploader from './ImageUploader'
Quill.register('modules/imageUploader', ImageUploader)
Quill.register('modules/magicUrl', MagicUrl)

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

export const getModules = ({ imageUploader, disableImageUpload = false }) => {
  const toolbar = [
    [{ header: 2 }, 'bold', 'italic', 'link', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
  ]
  
  if (!disableImageUpload) {
    toolbar.push(['image'])
  }
  
  return {
    toolbar,
    imageUploader,
    magicUrl: true,
  }
}
