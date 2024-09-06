import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '@components/AddonCard/AddonCard'
import { getPlatformIcon } from '@/pages/AccountPage/DownloadsPage/DownloadsPage'
import { ReleaseInfoModel } from '@api/rest/releases'

const platformTitles = {
  windows: 'Windows',
  darwin: 'MacOS',
  linux: 'Linux',
}

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
      <Styled.AddonsContainer style={{ display: 'flex', flexDirection: 'column' }}>
        {sortedInstallers.map((installer) => (
          <AddonCard
            key={installer.platform}
            title={platformTitles[installer.platform]}
            name={installer.platform}
            endContent={getPlatformIcon(installer.platform)}
            icon={selectedPlatforms.includes(installer.platform) ? 'check_circle' : 'circle'}
            isSelected={selectedPlatforms.includes(installer.platform)}
            onClick={() => handlePlatformClick(installer.platform)}
          />
        ))}
      </Styled.AddonsContainer>
      <Footer
        next="Confirm"
        onNext={onSubmit}
        nextProps={{ disabled: !selectedPlatforms.length }}
      />
    </Styled.Section>
  )
}
