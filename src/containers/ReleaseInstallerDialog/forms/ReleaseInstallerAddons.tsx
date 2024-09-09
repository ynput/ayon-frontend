import { FC, useEffect, useState } from 'react'
import { ReleaseForm } from '../hooks/useReleaseForm'
import { ReleaseAddon } from '@api/rest/releases'
import AddonsSelectGrid from '@components/AddonsSelectGrid/AddonsSelectGrid'
import { Footer } from '../components'

interface ReleaseInstallerAddonsProps {
  releaseForm: ReleaseForm
  releaseAddons: ReleaseAddon[]
  isLoading: boolean
  onCancel: () => void
  onConfirm: (selected: string[]) => void
}

export const ReleaseInstallerAddons: FC<ReleaseInstallerAddonsProps> = ({
  releaseAddons,
  releaseForm,
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
      <span>Select release addons</span>
      <AddonsSelectGrid
        addons={releaseAddons}
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
