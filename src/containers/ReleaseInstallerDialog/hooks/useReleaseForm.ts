import React, { useEffect, useState } from 'react'
import { BundleModel } from '@api/rest/bundles'
import { ReleaseListItemModel } from '@api/rest/releases'
import { useLazyListInstallersQuery } from '@queries/installers/getInstallers'

export type ReleaseForm = {
  addons: string[]
  name: string | null
  platforms: string[]
}

type Props = {
  release: ReleaseListItemModel | null
  bundle: BundleModel | null
}

export const useReleaseForm = ({
  release,
  bundle,
}: Props): [ReleaseForm, React.Dispatch<React.SetStateAction<ReleaseForm>>] => {
  const [releaseForm, setReleaseForm] = useState<ReleaseForm>({
    addons: [],
    name: null,
    platforms: [],
  })

  const [getInstallers] = useLazyListInstallersQuery()

  const buildInitForm = async ({
    bundle,
    release,
  }: {
    release: ReleaseListItemModel
    bundle: BundleModel
  }) => {
    try {
      const { addons, installerVersion } = bundle
      const { installers = [] } =
        (await getInstallers({ version: installerVersion }).unwrap()) || {}

      const platforms = installers.map((i) => i.platform)

      const addonsList = Object.keys(addons || {})

      setReleaseForm({
        addons: addonsList,
        name: release.name,
        platforms,
      })
    } catch (error) {}
  }

  // set up initial form values based on highest bundle
  useEffect(() => {
    if (!release || !bundle) return

    buildInitForm({ bundle, release })
  }, [release, bundle, getInstallers, setReleaseForm])

  return [releaseForm, setReleaseForm]
}
