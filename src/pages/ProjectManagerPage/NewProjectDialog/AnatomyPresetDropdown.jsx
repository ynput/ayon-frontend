import { Dropdown } from 'primereact/dropdown'
import { useEffect } from 'react'
import { useGetAnatomyPresetsQuery } from '@queries/anatomy/getAnatomy'

const AnatomyPresetDropdown = ({ selectedPreset, setSelectedPreset }) => {
  // get presets lists data
  const { data: presetList = [], isLoading, isSuccess } = useGetAnatomyPresetsQuery()
  // Set initial preset when data is loaded
  useEffect(() => {
    if (isLoading || !isSuccess) return
    if (!selectedPreset) setSelectedPreset(presetList[0].name)
  }, [presetList, isLoading, isSuccess])

  return (
    <Dropdown
      disabled={isLoading}
      value={selectedPreset}
      onChange={(e) => setSelectedPreset(e.value)}
      options={presetList}
      optionValue="name"
      optionLabel="title"
      tooltip="Preset"
      tooltipOptions={{ position: 'bottom' }}
      style={{ minWidth: 200 }}
    />
  )
}

export default AnatomyPresetDropdown
