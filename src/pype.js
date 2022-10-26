const pypeClient = {
  settings: {
    attributes: [],
  },

  getAttribSettings(name) {
    console.log(name, this.settings.attributes)
    for (const attr of this.settings.attributes) {
      if (attr.name === name) return attr
    }
    return null
  },
}

export default pypeClient
