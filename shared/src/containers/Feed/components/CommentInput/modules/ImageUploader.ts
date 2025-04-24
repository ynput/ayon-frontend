// @ts-nocheck
// inspired by quill-image-uploader
// credit: NoelOConnell

import { uploadFile } from '../helpers'

class ImageUploader {
  constructor(quill, options) {
    this.quill = quill
    this.options = options
    this.range = null
    this.placeholderDelta = null

    if (!this.options.project) console.warn('[Missing config] project name is required')

    var toolbar = this.quill.getModule('toolbar')
    if (toolbar) {
      toolbar.addHandler('image', this.selectLocalImage.bind(this))
    }

    this.handlePaste = this.handlePaste.bind(this)

    this.quill.root.addEventListener('paste', this.handlePaste, false)
  }

  selectLocalImage() {
    this.quill.focus()
    this.range = this.quill.getSelection()
    this.fileHolder = document.createElement('input')
    this.fileHolder.setAttribute('type', 'file')
    this.fileHolder.setAttribute('multiple', 'true')
    this.fileHolder.setAttribute('style', 'visibility:hidden')

    this.fileHolder.onchange = this.fileChanged.bind(this)

    document.body.appendChild(this.fileHolder)

    this.fileHolder.click()

    window.requestAnimationFrame(() => {
      document.body.removeChild(this.fileHolder)
    })
  }

  handlePaste(evt) {
    let clipboard = evt.clipboardData || window.clipboardData

    // IE 11 is .files other browsers are .items
    if (clipboard && (clipboard.items || clipboard.files)) {
      let items = clipboard.items || clipboard.files

      const files = []
      for (let i = 0; i < items.length; i++) {
        let file = items[i].getAsFile ? items[i].getAsFile() : items[i]

        if (file) {
          this.quill.focus()
          this.range = this.quill.getSelection()
          evt.preventDefault()

          files.push(file)
        }
      }

      this.readAndUploadFiles(files)
    }
  }

  readAndUploadFiles(files = []) {
    if (files.length === 0) return

    for (const file of files) {
      uploadFile(file, this.options.projectName, this.options.onUploadProgress).then(
        (data) => {
          this.options.onUpload && this.options.onUpload(data)
        },
        (error) => {
          this.options.onReject && this.options.onReject(error)
          console.warn(error)
        },
      )
    }
  }

  fileChanged() {
    const files = this.fileHolder.files
    this.readAndUploadFiles(files)
  }
}

export default ImageUploader
