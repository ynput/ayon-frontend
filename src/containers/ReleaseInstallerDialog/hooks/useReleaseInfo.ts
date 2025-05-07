import { useEffect, useState } from 'react'
import { useGetReleaseInfoQuery } from '@queries/releases/getReleases'
import { AddonVersionDetail, ReleaseInfoModel, ReleaseListItemModel } from '@shared/api'
import { ReleaseForm } from './useReleaseForm'

type Props = {
  selectedAddons: ReleaseForm['addons']
  selectedRelease: ReleaseForm['name']
  release: ReleaseListItemModel | null
}

export const useReleaseInfo = ({
  selectedAddons = [],
  selectedRelease,
  release,
}: Props): [
  ReleaseInfoModel | undefined,
  AddonVersionDetail[],
  {
    isError: boolean
    isLoading: boolean
  },
] => {
  // get full release once a release is set in releaseForm
  const {
    data: releaseInfo,
    isUninitialized,
    isFetching: isLoadingReleaseInfo,
  } = useGetReleaseInfoQuery({ releaseName: selectedRelease as string }, { skip: !selectedRelease })
  const releaseInfoError = !releaseInfo && !isLoadingReleaseInfo && !isUninitialized

  const [releaseAddons, setReleaseAddons] = useState<AddonVersionDetail[]>([])

  useEffect(() => {
    if (!releaseInfo || isLoadingReleaseInfo) return
    // set ordered addons based on selected
    const orderedAddons = [...(releaseInfo.addons || [])].sort((a, b) => {
      const mandatoryAddons = release?.mandatoryAddons || []
      const aIndex = selectedAddons.indexOf(a.name)
      const bIndex = selectedAddons.indexOf(b.name)

      if (aIndex !== -1 && bIndex !== -1) {
        const aMandatory = mandatoryAddons.includes(a.name)
        const bMandatory = mandatoryAddons.includes(b.name)
        if ((aMandatory && bMandatory) || (!aMandatory && !bMandatory)) {
          return a.name.localeCompare(b.name)
        }
        if (aMandatory && !bMandatory) return -1
        if (!aMandatory && bMandatory) return 1
      }
      return bIndex - aIndex
    })

    setReleaseAddons(orderedAddons)
  }, [releaseInfo, isLoadingReleaseInfo, selectedRelease])

  return [
    releaseInfo,
    releaseAddons,
    { isError: releaseInfoError, isLoading: isLoadingReleaseInfo },
  ]
}
