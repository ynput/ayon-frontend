/* eslint-disable */
import { useState, useEffect } from 'react'

import { Icon, InputSwitch } from '@ynput/ayon-react-components'

import {
  useLazyGetAddonSettingsQuery,
  useLazyGetAddonSettingsOverridesQuery,
} from '/src/services/addonSettings'

// TODO: move this to a common location
import { getValueByPath } from '../AddonSettings/utils'
import { isEqual } from 'lodash'

import VariantSelector from '/src/containers/AddonSettings/VariantSelector'
import ProjectDropdown from '/src/containers/ProjectDropdown'
import AddonDropdown from '/src/containers/CopySettings/AddonDropdown'

import {
  NodePanelWrapper,
  NodePanelHeader,
  NodePanelBody,
  NodePanelDirectionSelector,
  ChangeValue,
  ChangesTable,
} from '/src/containers/CopySettings/CopySettingsNode.styled'

import {
  isSimple,
  isList,
  isListOfSimple,
  isListOfNamedDicts,
  isCompatibleStructure,
} from '/src/helpers/objectComparison'

const FormattedPath = ({ value }) => {
  return <div className="path">{value.join(' / ')}</div>
}

const FormattedValue = ({ value }) => {
  if (isSimple(value)) {
    if (typeof value === 'boolean') return <ChangeValue>{value ? 'true' : 'false'}</ChangeValue>
    if (value === '') return <ChangeValue className="dim">no value</ChangeValue>
    return <ChangeValue>{value}</ChangeValue>
  } else if (!value) {
    // evaluate this after isSimple to let booleans pass through
    return <ChangeValue className="dim">no value</ChangeValue>
  } else if (isList(value)) {
    if (value.length === 0) return <ChangeValue className="dim">empty list</ChangeValue>

    if (isListOfSimple(value))
      return <ChangeValue title={value.join(', ')}>[ {value.join(', ')} ]</ChangeValue>

    const dictNames = isListOfNamedDicts(value)
    if (dictNames) {
      return <ChangeValue title={dictNames.join(', ')}>[ {dictNames.join(', ')} ]</ChangeValue>
    }

    return (
      <ChangeValue title={JSON.stringify(value, null, 2)} className="dim">
        [ complex list ]
      </ChangeValue>
    )
  }

  return (
    <ChangeValue className="dim" title={JSON.stringify(value, null, 2)}>
      [ complex object ]
    </ChangeValue>
  )
}

const CopySettingsNode = ({
  addonName,
  targetVersion,
  targetVariant,
  targetProjectName,

  nodeData,
  setNodeData,

  forcedSourceVersion,
  forcedSourceVariant,
  forcedSourceProjectName,
}) => {
  const [sourceVersion, setSourceVersion] = useState(null)
  const [sourceVariant, setSourceVariant] = useState(null)
  const [sourceProjectName, setSourceProjectName] = useState(null)
  const [loading, setLoading] = useState(false)

  const [triggerGetOverrides] = useLazyGetAddonSettingsOverridesQuery()
  const [triggerGetSettings] = useLazyGetAddonSettingsQuery()

  useEffect(() => {
    if (forcedSourceVersion && forcedSourceVersion !== sourceVersion) {
      setSourceVersion(forcedSourceVersion)
    } else if (forcedSourceVersion === null && sourceVersion === null) {
      setSourceVersion(targetVersion)
    }
  }, [forcedSourceVersion])

  useEffect(() => {
    if (forcedSourceVariant && forcedSourceVariant !== sourceVariant) {
      setSourceVariant(forcedSourceVariant)
    } else if (forcedSourceVariant === null && sourceVariant === null) {
      const defaultSourceVariant = targetVariant === 'staging' ? 'production' : 'staging'
      setSourceVariant(defaultSourceVariant)
    }
  }, [forcedSourceVariant])

  useEffect(() => {
    if (forcedSourceProjectName && forcedSourceProjectName !== sourceProjectName) {
      console.log('forcedSourceProjectName', forcedSourceProjectName)
      setSourceProjectName(forcedSourceProjectName)
    } else if (forcedSourceProjectName === null && sourceProjectName === null) {
      setSourceProjectName(null)
    }
  }, [forcedSourceProjectName])

  const loadNodeData = async () => {
    if (!sourceVersion || !sourceVariant) return
    if (targetProjectName && !sourceProjectName) return
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
      asVersion: targetVersion,
    })

    const sourceSettings = await triggerGetSettings({
      addonName,
      addonVersion: sourceVersion,
      variant: sourceVariant,
      projectName: sourceProjectName,
      asVersion: targetVersion,
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

      //const compatible = sameKeysStructure(sourceValue, targetValue)
      const compatible = isCompatibleStructure(sourceValue, targetValue)

      const item = {
        key: id,
        path: sourceOverride.path,
        sourceValue,
        targetValue,
        enabled: !!compatible,
        compatible: !!compatible,
        warnings: compatible || [],
      }
      changes.push(item)
    }

    if (!changes.length) {
      setNodeData({ message: 'no overrides to copy', enabled: false })
      setLoading(false)
      return
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
    console.log('LOAD', addonName, sourceVersion, sourceVariant, sourceProjectName)
    loadNodeData()
  }, [sourceVersion, sourceVariant, sourceProjectName])

  const expanded = !!(nodeData?.available && nodeData?.enabled)

  if (forcedSourceVersion && forcedSourceVariant && !nodeData?.available) return null

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
        disabled={forcedSourceVersion}
      />

      {sourceProjectName && (
        <ProjectDropdown
          projectName={sourceProjectName}
          setProjectName={setSourceProjectName}
          disabled={forcedSourceProjectName}
        />
      )}
      {!forcedSourceVariant && (
        <VariantSelector
          variant={sourceVariant}
          setVariant={setSourceVariant}
          disabled={forcedSourceVariant}
        />
      )}

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
      {/*
      {targetProjectName && (
        <ProjectDropdown projectName={targetProjectName} setProjectName={() => { }} disabled />
      )}
      <VariantSelector variant={targetVariant} setVariant={() => { }} disabled />
      */}
    </NodePanelHeader>
  )

  // is it a table? it is. So i'm using a table. don't judge me!
  // i am almost 40 years old and i can use a table if i want to.

  const body = (
    <NodePanelBody>
      <ChangesTable>
        <tr>
          <th className="btn">&nbsp;</th>
          <th>Path</th>
          <th className="valpvw">Current&nbsp;value</th>
          <th className="valpvw">New&nbsp;value</th>
        </tr>
        {(nodeData?.changes || []).map((change) => (
          <tr key={change.key}>
            <td>
              <InputSwitch
                checked={change.enabled}
                disabled={!change.compatible}
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
            </td>
            <td>
              {' '}
              <FormattedPath value={change.path} />{' '}
            </td>
            <td>
              {' '}
              <FormattedValue value={change.targetValue} />{' '}
            </td>
            <td>
              {' '}
              <FormattedValue value={change.sourceValue} />{' '}
            </td>

            {/*
              <td>
                &nbsp;
                {!change.compatible && <Icon icon="warning" style={{ color: 'red' }} />}
                {change.warnings.length > 0 && <Icon icon="warning" style={{ color: 'yellow' }} />}
              </td>
              */}
          </tr>
        ))}
      </ChangesTable>
    </NodePanelBody>
  )

  return (
    <NodePanelWrapper className={expanded ? 'expanded' : undefined}>
      {loading && <NodePanelBody>loading...</NodePanelBody>}
      {header}
      {expanded && body}
    </NodePanelWrapper>
  )
}

export default CopySettingsNode
