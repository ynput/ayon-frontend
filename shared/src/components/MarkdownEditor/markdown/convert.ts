import { $convertToMarkdownString, $generateNodesFromMarkdownString } from '@lexical/markdown'
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isLineBreakNode,
  $isParagraphNode,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
  type ParagraphNode,
} from 'lexical'
import { MARKDOWN_TRANSFORMERS } from './transformers'

const FENCE_REGEX = /^\s*(`{3,}|~{3,})/

// Mark which lines are part of a fenced code block (fences included)
const getCodeLines = (lines: string[]) => {
  let fence: string | null = null
  return lines.map((line) => {
    const fenceMatch = line.match(FENCE_REGEX)
    if (fence) {
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        fence = null
      }
      return true
    }
    if (fenceMatch) fence = fenceMatch[1]
    return !!fenceMatch
  })
}

// Apply `fn` to every line that is not inside a fenced code block, returning null drops the line
const mapLinesOutsideCode = (
  markdown: string,
  fn: (line: string, index: number, lines: string[]) => string | null,
) => {
  const lines = markdown.split('\n')
  const isCode = getCodeLines(lines)
  const result: string[] = []
  lines.forEach((line, i) => {
    if (isCode[i]) return result.push(line)
    const mapped = fn(line, i, lines)
    if (mapped !== null) result.push(mapped)
  })
  return result.join('\n')
}

/*
 * Paragraph model (same as GitHub):
 *   editor                          markdown
 *   paragraph, paragraph            `a\\` + newline + `b`  (one markdown paragraph, hard line break)
 *   paragraph, empty, paragraph     `a` + blank line + `b`   (two markdown paragraphs)
 * Enter starts a new line, an empty line between paragraphs is a paragraph break. Only one empty
 * line is kept between blocks (EmptyParagraphPlugin), markdown has no way to store more.
 */

interface Block {
  lines: string[]
  // blank lines before the block
  blanksBefore: number
  isCode: boolean
}

// Split markdown into blocks separated by blank lines (fenced code blocks can contain blank lines)
const toBlocks = (markdown: string): Block[] => {
  const lines = markdown.split('\n')
  const isCode = getCodeLines(lines)
  const blocks: Block[] = []
  let current: Block | null = null
  let blanks = 0

  lines.forEach((line, i) => {
    if (!isCode[i] && line.trim() === '') {
      if (current) blocks.push(current)
      current = null
      blanks++
      return
    }
    const startsFence = isCode[i] && (i === 0 || !isCode[i - 1])
    if (current && (startsFence || (current.isCode && !isCode[i]))) {
      blocks.push(current)
      current = null
    }
    if (!current) {
      current = { lines: [], blanksBefore: blanks, isCode: isCode[i] }
      blanks = 0
    }
    current.lines.push(line)
  })
  if (current) blocks.push(current)
  return blocks
}

const NON_PARAGRAPH_START = /^\s*([-*+]\s|\d+[.)]\s|#{1,6}\s|>|\||:::|<\/?[a-z])/i
const isParagraphBlock = (block: Block) =>
  !block.isCode && !NON_PARAGRAPH_START.test(block.lines[0])

const endsWithHardBreak = (line: string) => (line.match(/\\+$/)?.[0].length ?? 0) % 2 === 1

const blockText = (block: Block) => {
  if (block.isCode) return block.lines.join('\n')
  // a hard break at the end of a block renders as a literal backslash
  const lines = [...block.lines]
  const last = lines.length - 1
  if (endsWithHardBreak(lines[last])) lines[last] = lines[last].slice(0, -1).trimEnd()
  // check list items are written as `* [ ]`, which the backend and checklist counters look for
  return lines.map((line) => line.replace(CHECK_ITEM_MARKER, '$1* $2')).join('\n')
}

const CHECK_ITEM_MARKER = /^(\s*)[-+] (\[[ xX]\]\s)/

const isSpacerLine = (line: string) => /^\s*(&nbsp;|<br\s*\/?>)\s*$/i.test(line)

/**
 * Clean up markdown written by the legacy quill editor:
 * - quill wrote every line as its own paragraph and blank lines as `&nbsp;` spacer paragraphs.
 *   When spacers are found, paragraphs next to each other become lines of one paragraph and the
 *   spacers become paragraph breaks.
 * - `<u>` tags are dropped (markdown has no underline)
 */
export const normalizeLegacyMarkdown = (markdown: string) => {
  const cleaned = mapLinesOutsideCode(markdown.replace(/\r\n?/g, '\n'), (line) =>
    line.replace(/<\/?u>/gi, ''),
  )

  const blocks = toBlocks(cleaned)
  const isLegacy = blocks.some((b) => !b.isCode && b.lines.some(isSpacerLine))
  if (!isLegacy) return cleaned

  let output = ''
  let previous: Block | null = null
  let gap = false
  for (const block of blocks) {
    const lines = block.isCode ? block.lines : block.lines.filter((l) => !isSpacerLine(l))
    if (!lines.length) {
      gap = true
      continue
    }
    const current = { ...block, lines }
    const text = lines.join('\n')
    if (!previous) output = text
    else if (!gap && isParagraphBlock(previous) && isParagraphBlock(current)) {
      output += '\\\n' + text
    } else output += '\n\n' + text
    previous = current
    gap = false
  }
  return output
}

// same test lexical uses, empty paragraphs are not written to markdown
const $isEmptyParagraph = (node: LexicalNode) => {
  if (!$isParagraphNode(node)) return false
  const first = node.getFirstChild()
  return (
    first === null ||
    (node.getChildrenSize() === 1 && $isTextNode(first) && /^\s{0,3}$/.test(first.getTextContent()))
  )
}

/**
 * Lexical writes every block one blank line apart and drops empty paragraphs, so the markdown
 * blocks are matched back to the editor blocks to apply the paragraph model: lines next to each
 * other are joined with a hard break, an empty line between them makes a paragraph break.
 */
const $toMarkdownParagraphs = (markdown: string, container: ElementNode) => {
  const blocks = toBlocks(markdown)
  const editorBlocks: { isParagraph: boolean; hasGapBefore: boolean }[] = []
  let gap = false
  for (const child of container.getChildren()) {
    if ($isEmptyParagraph(child)) {
      gap = true
      continue
    }
    editorBlocks.push({ isParagraph: $isParagraphNode(child), hasGapBefore: gap })
    gap = false
  }
  // should not happen, fall back to plain markdown blocks
  const isMatched = editorBlocks.length === blocks.length

  return blocks
    .map((block, i) => {
      const text = blockText(block)
      if (i === 0) return text
      const isNewLine = isMatched
        ? !editorBlocks[i].hasGapBefore &&
          editorBlocks[i].isParagraph &&
          editorBlocks[i - 1].isParagraph
        : false
      return (isNewLine ? '\\\n' : '\n\n') + text
    })
    .join('')
    .trim()
}

const $splitOnLineBreaks = (paragraph: ParagraphNode): ParagraphNode[] => {
  const paragraphs = [paragraph]
  let current = paragraph
  for (const child of paragraph.getChildren()) {
    if ($isLineBreakNode(child)) {
      current = $createParagraphNode().setFormat(paragraph.getFormatType())
      paragraphs.push(current)
      child.remove()
    } else if (current !== paragraph) {
      current.append(child)
    }
  }
  return paragraphs
}

// Imported markdown blocks -> editor blocks (see paragraph model above)
export const $toEditorBlocks = (nodes: LexicalNode[]): LexicalNode[] => {
  const result: LexicalNode[] = []
  nodes.forEach((node, i) => {
    if (!$isParagraphNode(node)) {
      result.push(node)
      return
    }
    if (i > 0 && $isParagraphNode(nodes[i - 1])) result.push($createParagraphNode())
    result.push(...$splitOnLineBreaks(node))
  })
  return result
}

export const $markdownToNodes = (markdown: string) =>
  // shouldMergeAdjacentLines: a soft line break renders as a space, so show it as one
  $toEditorBlocks(
    $generateNodesFromMarkdownString(
      normalizeLegacyMarkdown(markdown || ''),
      MARKDOWN_TRANSFORMERS,
      false,
      true,
    ),
  )

export const $setMarkdown = (markdown: string) => {
  const root = $getRoot()
  const nodes = $markdownToNodes(markdown)
  root.clear()
  root.append(...(nodes.length ? nodes : [$createParagraphNode()]))
  if ($getSelection() !== null) root.selectStart()
}

export const $getMarkdown = (node: ElementNode = $getRoot()) =>
  $toMarkdownParagraphs($convertToMarkdownString(MARKDOWN_TRANSFORMERS, node, false), node)

export const $isEditorEmpty = () => {
  const root = $getRoot()
  const children = root.getChildren()
  if (children.length === 0) return true
  if (children.length > 1) return false
  const first = children[0]
  return $isParagraphNode(first) && first.getTextContentSize() === 0
}
