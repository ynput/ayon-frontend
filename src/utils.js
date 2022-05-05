import axios from 'axios'


const arrayEquals = (a, b) => {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index])
  )
}


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
  for (const preset of response.data.presets) {
    if (preset.primary)
      primaryPreset = { name: preset.name, title: `<default (${preset.name})>` }
    presets.push({ 
      name: preset.name, 
      title: preset.name, 
      version: preset.version, 
      primary: preset.primary ? "PRIMARY" : ""
    })
  }
  return [primaryPreset, ...presets]
}

export {
  arrayEquals,
  loadAnatomyPresets
}
