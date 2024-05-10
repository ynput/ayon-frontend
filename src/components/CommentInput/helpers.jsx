import TurndownService from 'turndown'

// override the escaping of markdown characters
// https://github.com/mixmark-io/turndown?tab=readme-ov-file#escaping-markdown-characters
TurndownService.prototype.escape = (string) => string

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
      content.replace(/(\r\n|\n|\r)/gm, '') +
      '\n\n'
    )
  },
})

turndownService.addRule('taskListItems', {
  filter: function (node) {
    return node.nodeName === 'PRE'
  },
  replacement: function (content, node) {
    if (node.id === 'ticks') {
      return '```' + content + '```'
    } else {
      const language = node.querySelector('code')?.className.split('-')[1] || 'python'
      return '```' + language + '\n' + content + '```'
    }
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

export async function typeWithDelay(quill, retain, type, delay = 1) {
  for (let i = 0; i < type.length; i++) {
    quill.insertText(retain + i, type[i])
    await new Promise((resolve) => setTimeout(resolve, delay))
  }
}

import axios from 'axios'
const abortController = new AbortController()
const cancelToken = axios.CancelToken
const cancelTokenSource = cancelToken.source()
import { toast } from 'react-toastify'

// used to upload files (quill ImageUploader module)
export const uploadFile = (file, projectName, onUploadProgress) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('image', file)
    const opts = {
      signal: abortController.signal,
      cancelToken: cancelTokenSource.token,
      onUploadProgress: (e) => onUploadProgress && onUploadProgress(e, file),
      headers: {
        'Content-Type': file.type,
        'x-file-name': file.name,
      },
    }
    axios
      .post(`/api/projects/${projectName}/files`, file, opts)
      .then((result) => {
        resolve({ file: file, data: result.data })
      })
      .catch((error) => {
        reject({ error: 'Upload failed' })
        console.error('File upload:', error)
        toast.error('Upload failed: ' + error.response.data.detail)
      })
  })
}

export const handleFileDrop = (e, projectName, onProgress, onSuccess) => {
  e.preventDefault()
  e.stopPropagation()

  let files = e.dataTransfer.files
  if (files?.length) {
    if (files.length === 0) return

    for (const file of files) {
      uploadFile(file, projectName, onProgress).then(
        (data) => onSuccess(data),
        (error) => {
          toast.error('Upload failed: ' + error.response.data.detail)
          console.warn(error)
        },
      )
    }
  }
}

export const getUsersContext = ({ users = [], entities = [], teams = [], currentUser }) => {
  const myTeams = teams.filter((team) => team.members.some((member) => member.name === currentUser))
  return [...users].map((user) => ({
    ...user,
    // is the user assigned or an author of any of the entities?
    onEntities: entities.some((entity) => entity.users?.includes(user.name)),
    // is the user on the same team as currently logged in user?
    onSameTeam: myTeams.some((team) => team.members.some((member) => member.name === user.name)),
  }))
}
