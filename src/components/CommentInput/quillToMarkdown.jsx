import TurndownService from 'turndown'

// override the escaping of markdown characters
// https://github.com/mixmark-io/turndown?tab=readme-ov-file#escaping-markdown-characters
TurndownService.prototype.escape = (string) => string

var turndownService = new TurndownService()

// support lists with checkboxes
turndownService.addRule('taskListItems', {
  filter: function (node) {
    return ['checked', 'unchecked'].includes(node.getAttribute('data-list'))
  },
  replacement: function (content, node) {
    return (
      (node.getAttribute('data-list') === 'checked' ? '* [x]' : '* [ ]') +
      ' ' +
      content.replace(/(\r\n|\n|\r)/gm, '') +
      '\n\n'
    )
  },
})

turndownService.addRule('codeblock', {
  filter: function (node) {
    return node.classList.contains('ql-code-block-container')
  },
  replacement: function (content, node) {
    const lines = node.children
    // each child node is a new line so add a newline character
    const codeBlockString = Array.from(lines)
      .map((line) => line.innerText)
      .join('\n')
    // wrap the content in ``` to create a code block
    return '```\n' + codeBlockString + '\n```'
  },
})

// if there is a double backslash followed by text, \\text, replace with \\\ so it resolves to \\text
turndownService.addRule('doubleBackslash', {
  filter: function (node) {
    return node.innerText?.includes('\\\\')
  },
  replacement: function (content) {
    return content.replaceAll('\\\\', '\\\\\\\\')
  },
})

// ordered list for both ul and ol
turndownService.addRule('unOrderedList', {
  filter: function (node) {
    return node.nodeName === 'LI' && node.getAttribute('data-list') === 'bullet'
  },
  replacement: function (content) {
    return '- ' + content + '\n'
  },
})

// replace <p> with <br> for line breaks
const replaceLineBreaks = (html) => {
  return html.replaceAll('<p>', '').replaceAll('</p>', '\n').replaceAll('```', '')
}

// remove extra lines in ``` code blocks
const parseCodeBlocks = (value) => {
  // first get the code blocks
  const regex = /```(.*?)```/g
  const matches = value.match(regex)

  // for each code block, wrap with <pre><code> tags
  if (matches) {
    matches.forEach((match) => {
      const newMatch = `<pre id='ticks'><code>${replaceLineBreaks(match)}</code></pre>`
      value = value.replace(match, newMatch)
    })
  }

  return value
}

export const convertToMarkdown = (value) => {
  const codeBlocksParsed = parseCodeBlocks(value)

  // convert to markdown
  let markdown = turndownService.turndown(codeBlocksParsed)

  let body = markdown

  // inside the markdown, find characters inside () or [] and replace @ with nothing
  const regex = /\((.*?)\)|\[(.*?)\]/g
  const matches = markdown.match(regex)
  if (matches) {
    matches.forEach((match) => {
      if (match.includes('http')) return
      const newMatch = match.replaceAll('@', '')
      body = body.replace(match, newMatch)
    })
  }

  return body
}
