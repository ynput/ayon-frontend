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

const DEFAULT_PLATFORMS = ['windows', 'linux', 'darwin']

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

  // fall back to standard platforms so the user always has options, even when
  // the release manifest has no installers — install pipeline filters by manifest anyway
  const manifestPlatforms = releaseInstallers.map((i) => i.platform)
  const platforms = manifestPlatforms.length ? manifestPlatforms : DEFAULT_PLATFORMS

  return (
    <>
      <span>Select launcher platforms</span>
      <PlatformSelect
        platforms={platforms}
        selected={selected}
        onSelect={handleSelectPlatform}
        isLoading={isLoading}
      />
      <Footer onCancel={onCancel} onConfirm={handleConfirm} />
    </>
  )
}
