import { useEffect, useState } from 'react'
import { useGetReleaseInfoQuery } from '@queries/releases/getReleases'
import { ReleaseAddon, ReleaseInfoModel } from '@api/rest/releases'
import { ReleaseForm } from './useReleaseForm'

type Props = {
  selectedAddons: ReleaseForm['addons']
  selectedRelease: ReleaseForm['name']
}

export const useReleaseInfo = ({
  selectedAddons = [],
  selectedRelease,
}: Props): [
  ReleaseInfoModel | undefined,
  ReleaseAddon[],
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

  const [releaseAddons, setReleaseAddons] = useState<ReleaseAddon[]>([])

  useEffect(() => {
    if (!releaseInfo || isLoadingReleaseInfo) return
    // set ordered addons based on selected
    const orderedAddons = [...(releaseInfo.addons || [])].sort((a, b) => {
      const aIndex = selectedAddons.indexOf(a.name)
      const bIndex = selectedAddons.indexOf(b.name)

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
