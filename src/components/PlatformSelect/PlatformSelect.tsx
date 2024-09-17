import { forwardRef } from 'react'
import styled from 'styled-components'
import AddonCard from '@components/AddonCard/AddonCard'
import { getPlatformIcon, getPlatformLabel } from '@pages/AccountPage/DownloadsPage/DownloadsPage'

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-small);
  flex-wrap: wrap;
`

interface PlatformSelectProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  platforms: string[]
  selected: string[]
  onSelect: (platform: string) => void
}

const linuxInfo = 'This will install Rocky 9 specific environment that should be compatible with all EL9 linux variants'

const PlatformSelect = forwardRef<HTMLDivElement, PlatformSelectProps>(
  ({ platforms, selected, onSelect, ...props }, ref) => {
    return (
      <Container ref={ref} {...props}>
        {platforms.map((platform) => (
          <AddonCard
            key={platform}
            title={getPlatformLabel(platform)}
            name={platform}
            data-tooltip={platform === 'linux'? linuxInfo : undefined}
            endContent={getPlatformIcon(platform)}
            icon={selected.includes(platform) ? 'check_circle' : 'circle'}
            isSelected={selected.includes(platform)}
            onClick={() => onSelect(platform)}
          />
        ))}
      </Container>
    )
  },
)

export default PlatformSelect
