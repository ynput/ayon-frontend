// @ts-nocheck

import TurndownService from 'turndown'

export const EMPTY_PARAGRAPH_TOKEN = 'AYON_EMPTY_PARAGRAPH'

// override the escaping of markdown characters
// https://github.com/mixmark-io/turndown?tab=readme-ov-file#escaping-markdown-characters
TurndownService.prototype.escape = (string) => string

var turndownService = new TurndownService()

turndownService.addRule('emptyParagraph', {
  filter: function (node) {
    if (node.nodeName !== 'P') return false
    const childNodes = node.childNodes || []
    if (childNodes.length !== 1) return false
    const childNode = childNodes[0]
    return childNode?.nodeName === 'BR'
  },
  replacement: function () {
    return `\n\n${EMPTY_PARAGRAPH_TOKEN}\n\n`
  },
})

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

// unordered list
turndownService.addRule('unOrderedList', {
  filter: function (node) {
    return node.nodeName === 'LI' && node.getAttribute('data-list') === 'bullet'
  },
  replacement: function (content) {
    return '- ' + content + '\n'
  },
})

// ordered list
turndownService.addRule('orderedList', {
  filter: function (node) {
    return node.nodeName === 'LI' && node.getAttribute('data-list') === 'ordered'
  },
  replacement: function (content) {
    return '1. ' + content + '\n'
  },
})

// convert mention tags to links
turndownService.addRule('mention', {
  filter: function (node) {
    return node.classList.contains('mention') && node.getAttribute('data-value')
  },
  replacement: function (content, node) {
    return `[${content}](${node.getAttribute('data-value')})`
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

// replace any multi line quotes \n\n with a single \n
// matching \n\n>
const parseQuotes = (value) => {
  const regex = /\n\n>/g
  const matches = value.match(regex)

  if (matches) {
    matches.forEach((match) => {
      value = value.replace(match, '\n>')
    })
  }

  return value
}

export const getTextRefs = (text = '') => {
  // inside the markdown, find characters inside ()
  const regex2 = /\((.*?)\)/g
  const links = text.match(regex2) || []
  const entities = links.flatMap((link) => {
    // if https, then it is a link and not an entity
    if (link.includes('http')) {
      return []
    } else {
      // remove the ()
      const match = link.match(/\(([^)]+)\)/)
      let parts = []
      if (match) {
        // split by :
        parts = match[1].split(':')
      }
      return {
        type: parts[0],
        id: parts[1],
      }
    }
  })

  return entities
}

export const convertToMarkdown = (value) => {
  const codeBlocksParsed = parseCodeBlocks(value)

  // convert to markdown
  let markdown = turndownService.turndown(codeBlocksParsed)

  const quotesParsedMarkdown = parseQuotes(markdown)

  let body = quotesParsedMarkdown

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

  const entities = getTextRefs(markdown)

  return [body, entities]
}

// "8061b1801dab11ef95ad0242ac180005"
