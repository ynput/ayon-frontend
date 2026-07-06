import { usePowerpack } from '@shared/context'
import { UseExtraSlices } from '../context/SlicerContext'
import { useLoadModule } from '@shared/hooks'
import SlicerDropdownFallback from '../components/SlicerDropdownFallback'

export const useSlicerRemotes = () => {
  const useExtraSlicesDefault: UseExtraSlices = () => {
    return {
      formatStatuses: () => [],
      formatTaskTypes: () => [],
      formatTypes: () => [],
      formatAssignees: () => [],
      formatAttribute: () => [],
      formatProductTypes: () => [],
      formatAuthors: () => [],
    }
  }

  const { powerLicense } = usePowerpack()

  // slicer transformers
  const [useExtraSlices, { isLoading: isLoadingExtraSlices }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'useExtraSlices',
    fallback: useExtraSlicesDefault,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  const [SlicerDropdown] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'SlicerDropdown',
    fallback: SlicerDropdownFallback,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  return { useExtraSlices, isLoadingExtraSlices, SlicerDropdown: SlicerDropdown }
}
