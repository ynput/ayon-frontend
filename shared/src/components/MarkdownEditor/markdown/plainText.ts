/**
 * Markdown as one line of plain text, e.g. for a summary of a description change. Mentions and
 * links become their label, images their name, and formatting, block markers and line breaks go.
 */
export const markdownToPlainText = (markdown: string): string =>
  markdown
    .replace(/\r\n?/g, '\n')
    // code fences (the code itself stays)
    .replace(/^\s*(```|~~~).*$/gm, '')
    // images, mentions `[label](type:id)` and links, keep the text
    .replace(/!?\[([^\]]*)\]\((?:\\.|[^)\\])*\)/g, '$1')
    // autolinks and html (e.g. legacy <u>, &nbsp;)
    .replace(/<(https?:[^>]+)>/g, '$1')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    // remove any leftover angle brackets so partial tags cannot survive
    .replace(/[<>]/g, '')
    .replace(/&nbsp;/g, ' ')
    // block markers: headings, quotes, lists, check lists
    .replace(/^\s*#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/gm, '')
    // inline formatting
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/(^|[^\w*\\])\*(?!\s)([^*]+?)\*(?!\w)/g, '$1$2')
    .replace(/(^|[^\w\\])_(?!\s)([^_]+?)_(?!\w)/g, '$1$2')
    // hard breaks and escapes
    .replace(/\\\n/g, '\n')
    .replace(/\\([\\`*_{}[\]()#+\-.!~>|])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
