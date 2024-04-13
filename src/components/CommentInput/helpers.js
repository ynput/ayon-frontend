import TurndownService from 'turndown'

var turndownService = new TurndownService()
// support lists with checkboxes
turndownService.addRule('taskListItems', {
  filter: function (node) {
    return node.parentNode.nodeName === 'UL' && node.parentNode.hasAttribute('data-checked')
  },
  replacement: function (content, node) {
    return (
      (node.parentNode.getAttribute('data-checked') === 'true' ? '* [x]' : '* [ ]') +
      ' ' +
      content +
      '\n\n'
    )
  },
})

export const convertToMarkdown = (value) => {
  // convert to markdown
  let markdown = turndownService.turndown(value)

  let body = markdown

  // inside the markdown, find characters inside () or [] and replace @ with nothing
  const regex = /\((.*?)\)|\[(.*?)\]/g
  const matches = markdown.match(regex)
  if (matches) {
    matches.forEach((match) => {
      if (match.includes('http')) return
      console.log('match', match)
      const newMatch = match.replaceAll('@', '')
      body = body.replace(match, newMatch)
    })
  }

  return body
}

// remove any query parameters from the url
export const parseImages = (body) => {
  //   find images in the markdown with format ![](image_url)
  const regex = /!\[.*?\]\((.*?)\)/g
  const matches = body.match(regex)

  let newBody = body

  if (matches) {
    matches.forEach((match) => {
      if (!match.includes('http')) return
      const url = match.match(/\(([^)]+)\)/)[1]
      const newUrl = url.split('?')[0]
      newBody = body.replace(url, newUrl)
    })
  }

  return newBody
}
