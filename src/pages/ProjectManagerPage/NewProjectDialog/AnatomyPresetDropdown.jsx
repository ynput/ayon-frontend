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
    if (!selectedPreset) {
      // find primary preset
      const primaryPreset = presetList.find((p) => p.primary)

      setSelectedPreset(primaryPreset?.name || '_')
    }
  }, [presetList, isLoading, isSuccess])

  // remove default options
  const options = [
    {
      value: '_',
      label: 'AYON default',
    },
    ...presetList.map((preset) => ({
      value: preset.name,
      label: preset.primary ? `${preset.name} (primary)` : preset.name,
    })),
  ]

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
