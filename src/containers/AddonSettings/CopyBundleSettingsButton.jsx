import { useState, useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import CopySettingsDialog from '@containers/CopySettings'
import { useGetAddonSettingsListQuery } from '@queries/addonSettings'

const CopyBundleSettingsButton = ({
  bundleName,
  variant,
  disabled,
  localData,
  setLocalData,
  changedKeys,
  setChangedKeys,
  setUnpinnedKeys,
  originalData,
  setOriginalData,
  projectName,
  siteId,
  pt,
}) => {
  const [dialogVisible, setDialogVisible] = useState(false)

  // Get a complete list of target addons (what's in the addon list)

  const { data: targetAddons, loading } = useGetAddonSettingsListQuery({
    projectName,
    siteId,
    variant,
  })

  const selectedAddons = useMemo(() => {
    if (loading) return []
    let result = []
    for (const addon of targetAddons?.addons || []) {
      if (siteId) {
        if (!projectName && !addon.hasSiteSettings)
          // global site overrides
          continue
        if (projectName && !addon.hasProjectSiteSettings)
          // project site overrides
          continue
      } else if (projectName && !addon.hasProjectSettings) continue
      else if (!addon.hasSettings && !addon.isBroken) continue

      const addonKey = `${addon.name}|${addon.version}|${variant}|${siteId || '_'}|${
        projectName || '_'
      }`

      result.push({
        ...addon,
        key: addonKey,
        variant,
      })
    }
    return result
  }, [targetAddons])

  return (
    <>
      <Button
        icon="system_update_alt"
        data-tooltip="Copy settings from another bundle"
        data-tooltip-delay={0}
        onClick={() => setDialogVisible(true)}
        disabled={disabled || !bundleName}
        {...pt?.button}
      />
      {dialogVisible && (
        <CopySettingsDialog
          selectedAddons={selectedAddons}
          variant={variant}
          originalData={originalData}
          setOriginalData={setOriginalData}
          localData={localData}
          setLocalData={setLocalData}
          changedKeys={changedKeys}
          setChangedKeys={setChangedKeys}
          setUnpinnedKeys={setUnpinnedKeys}
          projectName={projectName}
          onClose={() => setDialogVisible(false)}
          pickByBundle={true}
        />
      )}
    </>
  )
}

export default CopyBundleSettingsButton
