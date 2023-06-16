import { useMemo } from 'react'
import { ScrollPanel, Section } from '@ynput/ayon-react-components'
import { useGetInstallerListQuery } from '/src/services/installers'

const BundleDetail = ({ bundle }) => {
  const { data: installerList = [] } = useGetInstallerListQuery()

  const installerVersions = useMemo(() => {
    if (!installerList) return []

    const r = {}
    for (const installer of installerList) {
      if (r[installer.version]) {
        r[installer.version].push(installer.platform)
      } else {
        r[installer.version] = [installer.platform]
      }
    }

    return Object.entries(r).map(([version, platforms]) => ({
      label: `${version} (${platforms.join(', ')})`,
      value: version,
    }))
  }, [installerList])

  return (
    <Section>
      <pre>
        {JSON.stringify(bundle, null, 2)}
        {JSON.stringify(installerVersions, null, 2)}
      </pre>

      <ScrollPanel style={{ flexGrow: 1 }} className="transparent">
        addon list here
      </ScrollPanel>
    </Section>
  )
}

export default BundleDetail
