import { useEffect, useState } from 'react'
import { loadAnatomyPresets } from '/src/utils'
import { Dropdown } from 'primereact/dropdown'

const PresetDropdown = ({ selectedPreset, setSelectedPreset }) => {
  const [presetList, setPresetList] = useState([])

  useEffect(() => {
    loadAnatomyPresets().then((r) => {
      setPresetList(r)
      if (!selectedPreset) {
        setSelectedPreset(r[0].name)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Dropdown
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

export default PresetDropdown
