import React, { useEffect, useState } from 'react'
import { BundleModel } from '@api/rest/bundles'
import { ReleaseListItemModel } from '@api/rest/releases'
import { useLazyListInstallersQuery } from '@queries/installers/getInstallers'
import { guessPlatform } from '../helpers'
import { ReleaseState } from '@state/releaseInstaller'

export type ReleaseForm = {
  addons: string[]
  name: string | null
  platforms: string[]
}

type Props = {
  release: ReleaseListItemModel | null
  bundle: BundleModel | null
  inherit: ReleaseState['inherit']
}

export const useReleaseForm = ({
  release,
  bundle,
  inherit,
}: Props): [ReleaseForm, React.Dispatch<React.SetStateAction<ReleaseForm>>] => {
  const [releaseForm, setReleaseForm] = useState<ReleaseForm>({
    addons: [],
    name: null,
    platforms: [],
  })

  const [getInstallers] = useLazyListInstallersQuery()

  const getAddonsForForm = (
    addons: BundleModel['addons'] | null,
    release: ReleaseListItemModel,
  ): string[] => {
    let addonsList: string[] = []

    if (addons) {
      addonsList = Object.keys(addons || {})
    } else {
      // default to all addons for release
      addonsList = release.addons.map((a) => a)
    }

    // always add mandatory addons (non duplicated)
    release.mandatoryAddons?.forEach((addon) => {
      if (!addonsList.includes(addon)) {
        addonsList.push(addon)
      }
    })

    return addonsList
  }

  const buildInitForm = async ({
    bundle,
    release,
  }: {
    release: ReleaseListItemModel
    bundle: BundleModel | null
    inherit: ReleaseState['inherit']
  }) => {
    try {
      const { addons, installerVersion } = bundle || {}

      let platforms: string[] = []
      if (inherit.platforms) {
        const getInitialPlatforms = async (installerVersion: string | undefined) => {
          if (installerVersion) {
            const { installers = [] } =
              (await getInstallers({ version: installerVersion }).unwrap()) || {}
            return installers.map((i) => i.platform)
          } else {
            const guess = guessPlatform()
            return guess ? [guess] : []
          }
        }
        platforms = await getInitialPlatforms(installerVersion)
      }

      let addonsList = getAddonsForForm(inherit.addons ? addons : null, release)

      setReleaseForm({
        addons: addonsList,
        name: release.name,
        platforms,
      })
    } catch (error) {}
  }

  // set up initial form values based on highest bundle
  useEffect(() => {
    if (!release) return

    buildInitForm({ bundle, release, inherit })
  }, [release, bundle, inherit, getInstallers, setReleaseForm])

  return [releaseForm, setReleaseForm]
}
