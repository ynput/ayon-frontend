import { useMemo } from 'react'
import * as Styled from '../util/OnBoardingStep.styled'
import { ReleaseInfoModel, ReleaseListItemModel } from '@api/rest/releases'
import AddonsSelectGrid from '@components/AddonsSelectGrid/AddonsSelectGrid'

type AddonSelectStepProps = {
  Header: React.ElementType
  Footer: React.ElementType
  selectedAddons: string[]
  selectedPreset: string
  releases: ReleaseListItemModel[]
  release?: ReleaseInfoModel | null
  setSelectedAddons: (selectedAddons: string[]) => void
  isLoadingRelease: boolean
  isLoadingAddons: boolean
}

export const AddonSelectStep = ({
  Header,
  Footer,
  selectedAddons = [],
  selectedPreset,
  releases = [],
  release,
  setSelectedAddons,
  isLoadingRelease,
  isLoadingAddons,
}: AddonSelectStepProps) => {
  const { addons = [], mandatoryAddons } = release || {}
  // filter out mandatory addons
  const notMandatoryAddons = addons.filter((addon) => !mandatoryAddons?.includes(addon.name))

  // get placeholders for loading
  const placeholders = useMemo(() => {
    const currentRelease = releases.find((release) => release.name === selectedPreset)
    const notMandatorAddons = currentRelease?.addons.filter(
      (addon) => !currentRelease?.mandatoryAddons?.includes(addon),
    )
    return notMandatorAddons || [...Array(20)].map((_, i) => `Addon ${i}`)
  }, [selectedPreset, releases])

  const handleAddonClick = (name: string) => {
    // if it's already selected, remove it
    if (selectedAddons.includes(name)) {
      setSelectedAddons(selectedAddons.filter((addon) => addon !== name))
    } else {
      setSelectedAddons([...selectedAddons, name])
    }
  }

  return (
    <Styled.Section>
      <Header>Pick your Addons</Header>
      <AddonsSelectGrid
        isLoading={isLoadingAddons}
        placeholderCount={placeholders.length}
        addons={notMandatoryAddons}
        selected={selectedAddons}
        onSelect={handleAddonClick}
      />
      <Footer
        nextProps={{ saving: isLoadingRelease, disabled: isLoadingRelease }}
        showIcon={isLoadingRelease}
      />
    </Styled.Section>
  )
}
