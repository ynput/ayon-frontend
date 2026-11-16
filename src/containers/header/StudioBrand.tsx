import styled from 'styled-components'
import { useGlobalContext } from '@shared/context'
import { useGetConfigValueQuery } from '@shared/api'

const Logo = styled.img`
  display: block;
  height: 32px;
  max-width: 240px;
  object-fit: contain;
`

const Name = styled.span`
  font-size: 17px;
  font-weight: 900;
  line-height: 20px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  color: var(--md-sys-color-on-surface);
`

// the studio logo from Server Config > Customization, or the studio name when there is none
const StudioBrand = () => {
  const { siteInfo } = useGlobalContext()
  const { data: studioName } = useGetConfigValueQuery({ key: 'studio_name' })
  const name = typeof studioName === 'string' ? studioName : ''

  if (siteInfo?.studioLogo) return <Logo src={siteInfo.studioLogo} alt={name || 'Studio logo'} />
  if (name) return <Name>{name}</Name>
  return null
}

export default StudioBrand
