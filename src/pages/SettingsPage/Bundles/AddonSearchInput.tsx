import { useAddonSearchContext } from '@pages/SettingsPage/Bundles/context/addon-search'
import * as Styled from './Bundles.styled'
export const AddonSearchInput = () => {
  const { search, onSearchChange } = useAddonSearchContext()

  return (
    <Styled.StyledInput
      value={search}
      onChange={onSearchChange}
      placeholder="Search addons..."
      aria-label="Search addons"
    />
  )
}
