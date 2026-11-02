// Prism with the languages we offer, shared by the editor (lexical code highlighting) and the
// comment renderer so code looks the same in both. Prism must load before its language components.
import Prism from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-toml'
import 'prismjs/components/prism-ini'
import 'prismjs/components/prism-lua'
import 'prismjs/components/prism-glsl'
import 'prismjs/components/prism-hlsl'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-diff'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-powershell'

export { Prism }

// languages in the code block language picker, the value is written as the fence info string
export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: '', label: 'Plain text' },
  { value: 'bash', label: 'Bash' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'css', label: 'CSS' },
  { value: 'diff', label: 'Diff' },
  { value: 'glsl', label: 'GLSL' },
  { value: 'go', label: 'Go' },
  { value: 'hlsl', label: 'HLSL' },
  { value: 'html', label: 'HTML' },
  { value: 'ini', label: 'INI' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'lua', label: 'Lua' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'mel', label: 'MEL' },
  { value: 'powershell', label: 'PowerShell' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'toml', label: 'TOML' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'vex', label: 'VEX' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
]

export const getCodeLanguageLabel = (language?: string | null) =>
  CODE_LANGUAGES.find((option) => option.value === (language || ''))?.label || language || ''

// the grammar for a language or alias (py, sh, yml...), undefined when prism doesn't know it
export const getPrismGrammar = (language?: string | null) => {
  if (!language) return undefined
  const grammar = Prism.languages[language.toLowerCase()]
  return typeof grammar === 'object' ? grammar : undefined
}

// highlighted html (prism escapes the code), or null when the language isn't supported
export const highlightCode = (code: string, language?: string | null): string | null => {
  const grammar = getPrismGrammar(language)
  if (!grammar || !language) return null
  return Prism.highlight(code, grammar, language.toLowerCase())
}

// prism token types, highlighted with `token <type>` classes in the editor like prism does
const TOKEN_TYPES = [
  'atrule',
  'attr',
  'attr-name',
  'attr-value',
  'boolean',
  'builtin',
  'cdata',
  'char',
  'class',
  'class-name',
  'comment',
  'constant',
  'deleted',
  'doctype',
  'entity',
  'function',
  'important',
  'inserted',
  'keyword',
  'namespace',
  'number',
  'operator',
  'prolog',
  'property',
  'punctuation',
  'regex',
  'selector',
  'string',
  'symbol',
  'tag',
  'url',
  'variable',
]

export const CODE_HIGHLIGHT_THEME: Record<string, string> = Object.fromEntries(
  TOKEN_TYPES.map((type) => [type, `token ${type}`]),
)
