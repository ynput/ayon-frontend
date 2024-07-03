import * as Styled from '../util/OnBoardingStep.styled'
import AddonCard from '@components/AddonCard/AddonCard'
import { getPlatformIcon } from '@/pages/AccountPage/DownloadsPage/DownloadsPage'

const platformTitles = {
  windows: 'Windows',
  darwin: 'MacOS',
  linux: 'Linux',
}

export const PlatformSelectStep = ({
  Header,
  Footer,
  selectedPlatforms = [],
  setSelectedPlatforms,
  release = {},
  onSubmit,
}) => {
  const { installers = [] } = release

  const sortedInstallers = [...installers].sort((a, b) => a.platform.localeCompare(b.platform))

  const handlePlatformClick = (platform) => {
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
            version={getPlatformIcon(installer.platform)}
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
