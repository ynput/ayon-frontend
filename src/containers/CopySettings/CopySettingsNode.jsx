/* eslint-disable */
import { useState, useEffect } from 'react'

import { Icon, Spacer, InputSwitch } from '@ynput/ayon-react-components'

import {
  useLazyGetAddonSettingsQuery,
  useLazyGetAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'

// TODO: move this to a common location
import { getValueByPath } from '../AddonSettings/utils'
import { isEqual } from 'lodash'

import VariantSelector from '/src/containers/AddonSettings/VariantSelector'
import ProjectDropdown from '/src/containers/CopySettings/ProjectDropdown'
import AddonDropdown from '/src/containers/CopySettings/AddonDropdown'

import {
  NodePanelWrapper,
  NodePanelHeader,
  NodePanelBody,
  NodePanelDirectionSelector,
  ChangeRow,
  ChangeValue,
} from '/src/containers/CopySettings/CopySettingsNode.styled'

const FormattedPath = ({ value }) => {
  return <div className="path">{value.join(' / ')}</div>
}

const FormattedValue = ({ value }) => {
  let strval
  if (typeof value === 'object') strval = 'Complex object'
  else strval = value
  return <ChangeValue>{strval}</ChangeValue>
}

const CopySettingsNode = ({
  addonName,
  targetVersion,
  targetVariant,
  targetProjectName,

  nodeData,
  setNodeData,
}) => {
  const [sourceVersion, setSourceVersion] = useState(targetVersion)
  const [sourceVariant, setSourceVariant] = useState(targetVariant)
  const [sourceProjectName, setSourceProjectName] = useState(targetProjectName)
  const [loading, setLoading] = useState(false)

  const [triggerGetOverrides] = useLazyGetAddonSettingsOverridesQuery()
  const [triggerGetSettings] = useLazyGetAddonSettingsQuery()

  const loadNodeData = async () => {
    setLoading(true)

    if (
      sourceVersion === targetVersion &&
      sourceVariant === targetVariant &&
      sourceProjectName === targetProjectName
    ) {
      setNodeData({ message: 'cannot copy from itself' })
      setLoading(false)
      return
    }

    const changes = []
    const sourceOverrides = await triggerGetOverrides({
      addonName,
      addonVersion: sourceVersion,
      variant: sourceVariant,
      projectName: sourceProjectName,
    })

    const sourceSettings = await triggerGetSettings({
      addonName,
      addonVersion: sourceVersion,
      variant: sourceVariant,
      projectName: sourceProjectName,
    })

    // TODO: we may use this to display whether there
    // is an override or we are replacing with a default value

    // const targetOverrides = await triggerGetOverrides({
    //   addonName,
    //   addonVersion: targetBundleData.addons[addonName],
    //   variant: targetVariant,
    // })

    const targetSettings = await triggerGetSettings({
      addonName,
      addonVersion: targetVersion,
      variant: targetVariant,
      projectName: targetProjectName,
    })

    for (const id in sourceOverrides.data) {
      const sourceOverride = sourceOverrides.data[id]
      //const targetOverride = targetOverrides.data[id]

      // Remove noise
      if (sourceOverride.inGroup || sourceOverride.type === 'branch') continue

      // do not attempt to copy overrides from default or studio
      // to project level
      if (targetProjectName && ['default', 'studio'].includes(sourceOverride.level)) continue

      const sourceValue = getValueByPath(sourceSettings.data, sourceOverride.path)
      const targetValue = getValueByPath(targetSettings.data, sourceOverride.path)

      // do not attempt to copy if the values are the same
      if (isEqual(sourceValue, targetValue)) continue

      const item = {
        key: id,
        path: sourceOverride.path,
        sourceValue,
        targetValue,
        enabled: true,
      }
      changes.push(item)
    }

    if (!changes.length) {
      setNodeData({ message: 'no changes to copy' })
    }

    setNodeData({
      addonName: addonName,
      addonVersion: sourceVersion,
      targetAddonVersion: targetVersion,
      sourceSettings,
      targetSettings,
      changes,
      available: changes.length > 0,
      enabled: true,
    })

    setLoading(false)
  } //loadNodeData

  useEffect(() => {
    loadNodeData()
  }, [sourceVersion, sourceVariant, sourceProjectName])

  const expanded = !!(nodeData?.available && nodeData?.enabled)

  const header = (
    <NodePanelHeader className={expanded ? 'expanded' : undefined}>
      <InputSwitch
        checked={nodeData?.available && nodeData?.enabled}
        disabled={!nodeData?.available}
        onChange={(e) => {
          setNodeData({ ...nodeData, enabled: e.target.checked })
        }}
      />

      <AddonDropdown
        addonName={addonName}
        addonVersion={sourceVersion}
        setAddonVersion={setSourceVersion}
      />

      {sourceProjectName && (
        <ProjectDropdown projectName={sourceProjectName} setProjectName={setSourceProjectName} />
      )}
      <VariantSelector variant={sourceVariant} setVariant={setSourceVariant} />

      <NodePanelDirectionSelector>
        {nodeData?.available ? (
          <Icon icon="trending_flat" />
        ) : (
          <span className="message">{nodeData?.message || 'Nothing to copy'}</span>
        )}
      </NodePanelDirectionSelector>

      <AddonDropdown
        addonName={addonName}
        addonVersion={targetVersion}
        setAddonVersion={() => {}}
        disabled
      />
      {targetProjectName && (
        <ProjectDropdown projectName={targetProjectName} setProjectName={() => {}} disabled />
      )}
      <VariantSelector variant={targetVariant} setVariant={() => {}} disabled />
    </NodePanelHeader>
  )

  const body = expanded ? (
    <NodePanelBody>
      <div className="changes">
        {nodeData.changes.map((change) => (
          <ChangeRow key={change.key} className="change">
            <InputSwitch
              checked={change.enabled}
              onChange={(e) => {
                setNodeData({
                  ...nodeData,
                  changes: nodeData.changes.map((c) => {
                    if (c.key === change.key) {
                      c.enabled = e.target.checked
                    }
                    return c
                  }),
                })
              }}
            />
            <FormattedPath value={change.path} />
            <Spacer />
            <FormattedValue value={change.targetValue} />
            <Icon icon="trending_flat" />
            <FormattedValue value={change.sourceValue} />
          </ChangeRow>
        ))}
      </div>
    </NodePanelBody>
  ) : null

  return (
    <NodePanelWrapper className={expanded ? 'expanded' : undefined}>
      {loading && <NodePanelBody>loading...</NodePanelBody>}
      {header}
      {expanded && body}
    </NodePanelWrapper>
  )
}

export default CopySettingsNode
