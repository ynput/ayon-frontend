const ayonClient = {
  settings: {
    attributes: [],
  },

  getAttribSettings(name) {
    return this.settings.attributes.find((attr) => attr.name === name)
  },
}

export default ayonClient
