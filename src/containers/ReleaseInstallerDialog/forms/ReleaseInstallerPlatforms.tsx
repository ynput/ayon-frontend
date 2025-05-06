import { FC, useEffect, useState } from 'react'
import { ReleaseForm } from '../hooks/useReleaseForm'
import { InstallerManifest } from '@shared/api'
import PlatformSelect from '@components/PlatformSelect/PlatformSelect'
import { Footer } from '../components'

interface ReleaseInstallerPlatformsProps {
  releaseForm: ReleaseForm
  releaseInstallers: InstallerManifest[]
  isLoading: boolean
  onCancel: () => void
  onConfirm: (selected: string[]) => void
}

export const ReleaseInstallerPlatforms: FC<ReleaseInstallerPlatformsProps> = ({
  releaseInstallers,
  releaseForm,
  isLoading,
  onCancel,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (isLoading) return
    const selectedPlatforms = releaseForm.platforms || []
    setSelected(selectedPlatforms)
  }, [releaseForm, isLoading, setSelected])

  const handleSelectPlatform = (addon: string) => {
    // add or remove from selected
    if (selected.includes(addon)) {
      setSelected(selected.filter((a) => a !== addon))
    } else {
      setSelected([...selected, addon])
    }
  }

  const handleConfirm = () => onConfirm(selected)

  return (
    <>
      <span>Select launcher platforms</span>
      <PlatformSelect
        platforms={releaseInstallers.map((i) => i.platform)}
        selected={selected}
        onSelect={handleSelectPlatform}
      />
      <Footer onCancel={onCancel} onConfirm={handleConfirm} />
    </>
  )
}
