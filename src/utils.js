import axios from 'axios'

const loadAnatomyPresets = async () => {
  const defaultPreset = { name: '_', title: '<default (built-in)>' }
  let response
  try {
    response = await axios.get('/api/anatomy/presets')
  } catch (error) {
    return []
  }
  let primaryPreset = defaultPreset
  let presets = []
  for (const preset in response.data.presets) {
    if (preset.primary)
      primaryPreset = { name: preset.name, title: `<default (${preset.name})>` }
    presets.push({ name: preset.name, title: preset.title })
  }
  return [primaryPreset, ...presets]
}

export {
  loadAnatomyPresets
}
