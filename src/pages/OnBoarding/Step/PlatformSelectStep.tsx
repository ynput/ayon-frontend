import * as Styled from '../util/OnBoardingStep.styled'
import { ReleaseInfoModel } from '@shared/api'
import PlatformSelect from '@components/PlatformSelect/PlatformSelect'

type PlatformSelectStepProps = {
  Header: React.ElementType
  Footer: React.ElementType
  selectedPlatforms: string[]
  setSelectedPlatforms: (selectedPlatforms: string[]) => void
  release: ReleaseInfoModel
  onSubmit: () => void
}

export const PlatformSelectStep = ({
  Header,
  Footer,
  selectedPlatforms = [],
  setSelectedPlatforms,
  release,
  onSubmit,
}: PlatformSelectStepProps) => {
  const { installers = [] } = release

  const sortedInstallers = [...installers].sort((a, b) => a.platform.localeCompare(b.platform))

  const handlePlatformClick = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform])
    }
  }

  return (
    <Styled.Section>
      <Header>Pick your Platforms</Header>
      <PlatformSelect
        platforms={sortedInstallers.map((i) => i.platform)}
        selected={selectedPlatforms}
        onSelect={handlePlatformClick}
        style={{ width: 470, maxWidth: 470 }}
      />
      <Footer
        next="Confirm"
        onNext={onSubmit}
        nextProps={{ disabled: !selectedPlatforms.length }}
      />
    </Styled.Section>
  )
}
