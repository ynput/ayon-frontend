import { useEffect } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { PrismTokenizer, registerCodeHighlighting } from '@lexical/code-prism'
// registers the extra languages on the prism instance lexical uses
import '../code/prism'

// no default language: a plain ``` block stays plain instead of getting a language written into it
const tokenizer = { ...PrismTokenizer, defaultLanguage: null }

// Syntax highlighting of code blocks with prism, coloured by the `token` classes in the theme
const CodeHighlightPlugin = () => {
  const [editor] = useLexicalComposerContext()
  useEffect(() => registerCodeHighlighting(editor, tokenizer), [editor])
  return null
}

export default CodeHighlightPlugin
