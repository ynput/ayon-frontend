/* eslint-disable */
import { useState, useEffect } from 'react'

import { Icon, Spacer, InputSwitch } from '@ynput/ayon-react-components'

import {
  useLazyGetAddonSettingsQuery,
  useLazyGetAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'
// TODO: move this to a common location
import { getValueByPath, setValueByPath } from '../AddonSettings/utils'
import { cloneDeep, isEqual } from 'lodash'

import VariantSelector from '/src/containers/AddonSettings/VariantSelector'
import ProjectDropdown from '/src/containers/CopySettings/ProjectDropdown'
import AddonDropdown from '/src/containers/CopySettings/AddonDropdown'

import {
  NodePanelWrapper,
  NodePanelHeader,
  NodePanelToggle,
  NodePanelBody,
  NodePanelDirectionSelector,
  ChangeRow,
} from '/src/containers/CopySettings/CopySettingsNode.styled'

const FormattedPath = ({ value }) => {
  return <div className="path">{value.join(' / ')}</div>
}

const FormattedValue = ({ value }) => {
  let strval
  if (typeof value === 'object') strval = '[[COMPLEX]]'
  else strval = `"${value}"`
  return <div className="value">{strval}</div>
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
  const [expanded, setExpanded] = useState(true)
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(true)

  const toggleIcon = expanded ? 'expand_more' : 'chevron_right'

  const onToggle = () => setExpanded(!expanded)

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
    })

    setLoading(false)
  } //loadNodeData

  useEffect(() => {
    loadNodeData()
  }, [sourceVersion, sourceVariant, sourceProjectName])

  const header = (
    <NodePanelHeader className={expanded ? 'expanded' : undefined}>
      <NodePanelToggle>
        <Icon icon={toggleIcon} onClick={onToggle} className="panel-toggler" />
      </NodePanelToggle>

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
          <>{nodeData?.message || 'Nothing to copy'}</>
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

  /*
  if ((!nodeData) || loading) {
    return (
      <NodePanelWrapper className={expanded ? 'expanded' : undefined}>
        {header}
        {expanded && <NodePanelBody>loading...</NodePanelBody>}
      </NodePanelWrapper>
    )
  }
  */

  const body = (
    <NodePanelBody>
      {nodeData?.changes?.length ? (
        <div className="changes">
          {nodeData.changes.map((change) => (
            <ChangeRow key={change.key} className="change">
              <InputSwitch />
              <FormattedPath value={change.path} />
              <Spacer />
              <FormattedValue value={change.sourceValue} />
              <Icon icon="trending_flat" />
              <FormattedValue value={change.targetValue} />
            </ChangeRow>
          ))}
        </div>
      ) : (
        ''
      )}
    </NodePanelBody>
  )

  return (
    <NodePanelWrapper className={expanded ? 'expanded' : undefined}>
      {header}
      {expanded && body}
    </NodePanelWrapper>
  )
}

export default CopySettingsNode
