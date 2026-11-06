import { useAddonSearchContext } from '@pages/SettingsPage/Bundles/context/addon-search'
import SearchInput from '@components/SearchInput'

export const AddonSearchInput = () => {
  const { search, onSearchChange } = useAddonSearchContext()

  return <SearchInput value={search} onChange={onSearchChange} placeholder="Search addons" />
}
