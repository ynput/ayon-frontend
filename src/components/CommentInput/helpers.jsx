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

import axios from 'axios'
// quillModules
const abortController = new AbortController()
const cancelToken = axios.CancelToken
const cancelTokenSource = cancelToken.source()

// QUILL CONFIG
import Quill from 'quill'
import ImageUploader from 'quill-image-uploader'
import 'quill-image-uploader/dist/quill.imageUploader.min.css'
Quill.register('modules/imageUploader', ImageUploader)

// override icons with material icons
const getIcon = (icon) => '<span class="material-symbols-outlined icon">' + icon + '</span>'

var icons = Quill.import('ui/icons')
icons['header']['2'] = getIcon('format_h1')
icons['bold'] = getIcon('format_bold')
icons['italic'] = getIcon('format_italic')
icons['underline'] = getIcon('format_underlined')
icons['link'] = getIcon('link')
icons['list']['ordered'] = getIcon('format_list_numbered')
icons['list']['bullet'] = getIcon('format_list_bulleted')
icons['list']['check'] = getIcon('checklist')
icons['image'] = getIcon('image')

export const quillModules = {
  toolbar: [
    [{ header: 2 }, 'bold', 'italic', 'underline', 'link'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ['image'],
  ],
  imageUploader: {
    upload: (file) => {
      return new Promise((resolve, reject) => {
        const formData = new FormData()
        formData.append('image', file)

        const opts = {
          signal: abortController.signal,
          cancelToken: cancelTokenSource.token,
          headers: {
            'Content-Type': file.type,
          },
        }

        axios
          .post('http://localhost:3000/api/projects/no_comment/thumbnails', file, opts)
          .then((result) => {
            const thumbnailId = result.data.id

            const thumbnailUrl =
              'http://localhost:3000/api/projects/no_comment/thumbnails/' + thumbnailId
            resolve(thumbnailUrl)
          })
          .catch((error) => {
            reject('Upload failed')
            console.error('Error:', error)
          })
      })
    },
  },
}
