import {useAddonSearchContext} from "@pages/SettingsPage/Bundles/AddonSearchContext.tsx";
import * as Styled from './Bundles.styled'
export const AddonSearchInput = () => {
  const {search, onSearchChange} = useAddonSearchContext()

  return(
  <Styled.StyledInput
    value={search}
    onChange={onSearchChange}
    placeholder="Search addons..."
    aria-label="Search addons"
  />)
}
