import { Dropdown } from '@ynput/ayon-react-components'
import { useEffect } from 'react'
import { useGetAnatomyPresetsQuery } from '@queries/anatomy/getAnatomy'

const AnatomyPresetDropdown = ({ selectedPreset, setSelectedPreset }) => {
  // get presets lists data
  const { data: presetList = [], isLoading, isSuccess } = useGetAnatomyPresetsQuery()
  // Set initial preset when data is loaded
  useEffect(() => {
    if (isLoading || !isSuccess) return
    // this works because the default preset is always the first one
    if (!selectedPreset) setSelectedPreset(presetList[0].name)
  }, [presetList, isLoading, isSuccess])

  // remove default options
  const options = presetList
    .filter((preset) => !preset.default)
    .map((preset) => ({
      value: preset.name,
      label: preset.primary === 'PRIMARY' ? `${preset.title} (default)` : preset.title,
    }))

  return (
    <Dropdown
      options={options}
      value={[selectedPreset]}
      onChange={(value) => setSelectedPreset(value[0])}
      disabled={isLoading}
      data-tooltip="Preset"
      style={{ minWidth: 200 }}
    />
  )
}

export default AnatomyPresetDropdown
