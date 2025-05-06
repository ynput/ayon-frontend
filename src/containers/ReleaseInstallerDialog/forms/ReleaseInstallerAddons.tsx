import { FC, useEffect, useState } from 'react'
import { ReleaseForm } from '../hooks/useReleaseForm'
import { AddonVersionDetail } from '@shared/api'
import AddonsSelectGrid from '@components/AddonsSelectGrid/AddonsSelectGrid'
import { Footer } from '../components'

interface ReleaseInstallerAddonsProps {
  releaseForm: ReleaseForm
  releaseAddons: AddonVersionDetail[]
  mandatoryAddons: string[]
  isLoading: boolean
  onCancel: () => void
  onConfirm: (selected: string[]) => void
}

export const ReleaseInstallerAddons: FC<ReleaseInstallerAddonsProps> = ({
  releaseForm,
  releaseAddons,
  mandatoryAddons,
  isLoading,
  onCancel,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<string[]>([])

  useEffect(() => {
    if (isLoading) return
    const selectedAddons = releaseForm.addons || []
    setSelected(selectedAddons)
  }, [releaseForm, isLoading, setSelected])

  const handleSelectAddon = (addon: string) => {
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
      <span>Select addons to install from the release</span>
      <AddonsSelectGrid
        addons={releaseAddons}
        disabledAddons={mandatoryAddons}
        selected={selected}
        onSelect={handleSelectAddon}
        isLoading={isLoading}
        placeholderCount={20}
        style={{ maxWidth: 'unset', width: '100%' }}
        pt={{
          card: { className: 'shimmer-lightest' },
        }}
      />
      <Footer onCancel={onCancel} onConfirm={handleConfirm} />
    </>
  )
}
