const ayonClient = {
  settings: {
    attributes: [],
  },

  getAttribSettings(name) {
    return this.settings.attributes.find((attr) => attr.name === name)
  },
  getAttribsByScope(scope) {
    return this.settings.attributes.filter((attr) => attr.scope.includes(scope))
  },
}

export default ayonClient
