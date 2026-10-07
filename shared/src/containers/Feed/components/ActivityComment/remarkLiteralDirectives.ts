// Directives the comment renderer has a component for, e.g. `:status[In progress]{#id}`
export const COMMENT_DIRECTIVES = ['tip', 'status']

const DIRECTIVE_TYPES = ['textDirective', 'leafDirective', 'containerDirective']

type MdNode = {
  type: string
  name?: string
  value?: string
  children?: MdNode[]
  position?: { start: { offset?: number }; end: { offset?: number } }
}

const text = (value: string): MdNode => ({ type: 'text', value })
const paragraph = (value: string): MdNode => ({ type: 'paragraph', children: [text(value)] })

// The markdown a node was parsed from
const getSource = (node: MdNode, markdown: string): string | null => {
  const start = node.position?.start.offset
  const end = node.position?.end.offset
  if (start === undefined || end === undefined) return null
  return markdown.slice(start, end)
}

const toLiteral = (node: MdNode, markdown: string): MdNode[] | null => {
  const source = getSource(node, markdown)
  if (source === null) return null

  if (node.type === 'textDirective') return [text(source)]
  if (node.type === 'leafDirective') return [paragraph(source)]

  // container: keep the content as markdown, with the fences around it as text
  const [open, ...rest] = source.split('\n')
  const close = rest.length ? rest[rest.length - 1].match(/:{3,}\s*$/) : null
  return [paragraph(open), ...(node.children || []), ...(close ? [paragraph(close[0])] : [])]
}

const transform = (node: MdNode, markdown: string, known: string[]) => {
  if (!node.children) return

  const children: MdNode[] = []
  for (const child of node.children) {
    const isUnknown = DIRECTIVE_TYPES.includes(child.type) && !known.includes(child.name || '')
    const literal = isUnknown ? toLiteral(child, markdown) : null

    children.push(...(literal || [child]))
  }

  node.children = children
  children.forEach((child) => transform(child, markdown, known))
}

/**
 * remark-directive reads any `:name` as a directive, so `Note:fix this` or `:something` in a
 * comment would become an unknown, empty element and the text would be lost. This turns every
 * directive that is not in `known` back into the text that was typed.
 *
 * Use it after `remarkDirective` and before `remarkDirectiveRehype`.
 */
const remarkLiteralDirectives =
  (known: string[] = COMMENT_DIRECTIVES) =>
  (tree: MdNode, file: { value?: unknown }) => {
    transform(tree, String(file.value ?? ''), known)
  }

export default remarkLiteralDirectives
