import type { EditorThemeClasses } from 'lexical'
import { CODE_HIGHLIGHT_THEME } from './code/prism'

// Class names used by lexical when rendering nodes, styled in MarkdownEditor.styled.ts
export const editorTheme: EditorThemeClasses = {
  paragraph: 'md-paragraph',
  heading: {
    h1: 'md-heading md-h1',
    h2: 'md-heading md-h2',
    h3: 'md-heading md-h3',
    h4: 'md-heading md-h4',
    h5: 'md-heading md-h5',
    h6: 'md-heading md-h6',
  },
  quote: 'md-quote',
  // blocks like embedded videos
  embedBlock: { base: 'md-embed', focus: 'md-embed-focus' },
  link: 'md-link',
  code: 'md-code-block',
  // prism token types -> `token <type>` classes, coloured by codeTokenStyles
  codeHighlight: CODE_HIGHLIGHT_THEME,
  list: {
    ul: 'md-list md-list-ul',
    ol: 'md-list md-list-ol',
    checklist: 'md-list md-checklist',
    listitem: 'md-list-item',
    listitemChecked: 'md-list-item-checked',
    listitemUnchecked: 'md-list-item-unchecked',
    nested: {
      listitem: 'md-list-item-nested',
    },
  },
  text: {
    bold: 'md-bold',
    italic: 'md-italic',
    strikethrough: 'md-strikethrough',
    underline: 'md-underline',
    code: 'md-code',
  },
}
