import { useState, useEffect, useMemo, useRef } from 'react'
import { isEqual } from 'lodash'

import { Icon, InputSwitch } from '@ynput/ayon-react-components'

import {
  useLazyGetAddonSettingsQuery,
  useLazyGetAddonSettingsOverridesQuery,
} from '@queries/addonSettings'

// TODO: move this to a common location
import { getValueByPath } from '../AddonSettings/utils'

import VariantSelector from '@containers/AddonSettings/VariantSelector'
import ProjectDropdown from '@containers/ProjectDropdown'
import AddonDropdown from '@containers/CopySettings/AddonDropdown'

import {
  NodePanelWrapper,
  NodePanelHeader,
  NodePanelBody,
  NodeMessage,
  NodePanelDirectionSelector,
  ChangeValue,
  ChangesTable,
} from '@containers/CopySettings/CopySettingsNode.styled'

import {
  isSimple,
  isList,
  isListOfSimple,
  isListOfNamedDicts,
  isCompatibleStructure,
} from '@helpers/objectComparison'

const FormattedPath = ({ value }) => {
  return <div className="path">{value.join(' / ')}</div>
}

const FormattedValue = ({ value, level }) => {
  const val = useMemo(() => {
    if (isSimple(value)) {
      if (typeof value === 'boolean') {
        return <ChangeValue $level={level}>{value ? 'true' : 'false'}</ChangeValue>
      }
      if (value === '')
        return (
          <ChangeValue className="dim" $level={level}>
            no value
          </ChangeValue>
        )
      return <ChangeValue $level={level}>{value}</ChangeValue>
    } else if (!value) {
      // evaluate this after isSimple to let booleans pass through
      return (
        <ChangeValue className="dim" $level={level}>
          no value
        </ChangeValue>
      )
    } else if (isList(value)) {
      if (value.length === 0) {
        return (
          <ChangeValue className="dim" $level={level}>
            empty list
          </ChangeValue>
        )
      }

      if (isListOfSimple(value))
        return (
          <ChangeValue title={value.join(', ')} $level={level}>
            [ {value.join(', ')} ]
          </ChangeValue>
        )

      const dictNames = isListOfNamedDicts(value)
      if (dictNames) {
        return (
          <ChangeValue title={dictNames.join(', ')} $level={level}>
            [ {dictNames.join(', ')} ]
          </ChangeValue>
        )
      }

      return (
        <ChangeValue title={JSON.stringify(value, null, 2)} className="dim" $level={level}>
          [ complex list ]
        </ChangeValue>
      )
    }

    return (
      <ChangeValue className="dim" title={JSON.stringify(value, null, 2)} $level={level}>
        [ complex object ]
      </ChangeValue>
    )
  }, [value])

  return (
    <div
      style={{
        maxWidth: '200px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {val}
    </div>
  )
}

const CopySettingsNode = ({
  addonName,
  targetVersion,
  targetVariant,
  targetProjectName,

  nodeData,
  setNodeData,
  setNodeState,

  forcedSourceVersion,
  forcedSourceVariant,
  forcedSourceProjectName,

  isDev,
}) => {
  const [sourceVersion, setSourceVersion] = useState(null)
  const [sourceVariant, setSourceVariant] = useState(null)
  const [sourceProjectName, setSourceProjectName] = useState(null)
  const [loading, setLoading] = useState(false)
  const currentPromiseRef = useRef(null);

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
      setSourceProjectName(forcedSourceProjectName)
    } else if (forcedSourceProjectName === null && sourceProjectName === null) {
      setSourceProjectName(null)
    }
  }, [forcedSourceProjectName])

  const loadNodeData = async () => {
    if (!sourceVersion || !sourceVariant) return
    if (targetProjectName && !sourceProjectName) return
    setLoading(true)
    setNodeState('loading')

    if (
      sourceVersion === targetVersion &&
      sourceVariant === targetVariant &&
      sourceProjectName === targetProjectName
    ) {
      setNodeData({ message: 'cannot copy from itself' })
      setLoading(false)
      setNodeState('empty')
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

    const targetOverrides = await triggerGetOverrides({
      addonName,
      addonVersion: targetVersion,
      variant: targetVariant,
      projectName: targetProjectName,
      asVersion: targetVersion,
    })

    const sourceSettings = await triggerGetSettings({
      addonName,
      addonVersion: sourceVersion,
      variant: sourceVariant,
      projectName: sourceProjectName,
      asVersion: targetVersion,
    })

    const targetSettings = await triggerGetSettings({
      addonName,
      addonVersion: targetVersion,
      variant: targetVariant,
      projectName: targetProjectName,
    })

    let sourceParentSettings = null
    if (sourceProjectName) {
      sourceParentSettings = await triggerGetSettings({
        addonName,
        addonVersion: sourceVersion,
        variant: sourceVariant,
        projectName: null,
        asVersion: targetVersion,
      })
    }

    const allIds = [
      ...new Set([...Object.keys(sourceOverrides.data), ...Object.keys(targetOverrides.data)]),
    ]

    for (const id of allIds) {
      const sourceOverride = sourceOverrides.data[id]
      const targetOverride = targetOverrides.data[id]
      const path = sourceOverride?.path || targetOverride?.path
      const availableScopes = sourceOverride?.scope || targetOverride?.scope || ["studio", "project"]

      // Remove noise
      if (sourceOverride?.inGroup || sourceOverride?.type === 'branch' || targetOverride?.inGroup || targetOverride?.type === 'branch') {
        console.debug('Skipping override', path, 'because it is', sourceOverride?.inGroup ? 'in a group' : 'a branch')
        continue
      }

      if (targetProjectName && !availableScopes.includes('project')) {
        console.debug('Skipping override', path, 'because it is not project-scoped')
        continue
      } else if (!targetProjectName && !availableScopes.includes('studio')) {
        console.debug('Skipping override', path, 'because it is not studio-scoped')
        continue
      }

      let sourceValue = getValueByPath(sourceSettings.data, path)
      let targetValue = getValueByPath(targetSettings.data, path)
      let copyValue = sourceValue

      if (targetProjectName && ['default', 'studio'].includes(sourceOverride?.level)) {
        sourceValue = sourceParentSettings ? getValueByPath(sourceParentSettings.data, path) : null
      }

      // do not attempt to copy if the values are the same
      // ... or rather do copy it. we want to force pinned overrides
      if (isEqual(sourceValue, targetValue)) {
        if (sourceOverride?.level === targetOverride?.level) {
          console.debug(
            `Skipping override ${path} because it's the same:  ${sourceValue} === ${targetValue}`,
          )
          continue
        }
      }

      const compatible = isCompatibleStructure(sourceValue, targetValue)

      const item = {
        key: id,
        path: path,
        copyValue,
        sourceValue,
        targetValue,
        sourceLevel: sourceOverride?.level || 'default',
        targetLevel: targetOverride?.level || 'default',
        enabled: !!compatible,
        compatible: !!compatible,
        warnings: compatible || [],
        inGroup: sourceOverride?.inGroup || targetOverride?.inGroup,
      }
      changes.push(item)
    }

    if (!changes.length) {
      setNodeData({ message: 'no overrides to copy', enabled: false })
      setLoading(false)
      setNodeState('empty')
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
    setNodeState('loaded')
  } //loadNodeData

  useEffect(() => {
    const callLoadNodeData = async () => {
      // Wait for the current promise to finish if it exists
      if (currentPromiseRef.current) {
        await currentPromiseRef.current;
      }
      // Create a new promise for the current loadNodeData call
      const loadPromise = loadNodeData();
      currentPromiseRef.current = loadPromise;

      try {
        await loadPromise;
      } finally {
        // Clear the reference if the promise is resolved or rejected
        if (currentPromiseRef.current === loadPromise) {
          currentPromiseRef.current = null;
        }
      }
    };

    callLoadNodeData();
  }, [sourceVersion, sourceVariant, sourceProjectName])

  const expanded = !!(nodeData?.available && nodeData?.enabled)

  if (forcedSourceVersion && forcedSourceVariant && !nodeData?.available && !isDev) { 
    return null
  }

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
        disabled={forcedSourceVersion && !isDev}
      />

      {sourceProjectName && (
        <ProjectDropdown
          projectName={sourceProjectName}
          setProjectName={setSourceProjectName}
          disabled={forcedSourceProjectName && !isDev}
        />
      )}
      {!forcedSourceVariant && (
        <VariantSelector
          variant={sourceVariant}
          setVariant={setSourceVariant}
          disabled={forcedSourceVariant && !isDev}
        />
      )}

      <NodePanelDirectionSelector>
        {nodeData?.available ? (
          <Icon icon="trending_flat" />
        ) : (
          <NodeMessage>{nodeData?.message || 'Nothing to copy'}</NodeMessage>
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
  // i am 41 years old and i can use a table if i want to.

  const body = (
    <NodePanelBody>
      <ChangesTable>
        <thead>
        <tr>
          <th className="btn">&nbsp;</th>
          <th>Path</th>
          <th className="valpvw">Current&nbsp;value</th>
          <th className="valpvw">New&nbsp;value</th>
        </tr>
        </thead>
        <tbody>
        {(nodeData?.changes || []).map((change) => {

          return (
            <tr key={change.key}>
              <td>
                {change.inGroup && <Icon icon="folder" />}
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
                <FormattedPath value={change.path} />
              </td>
              <td>
                <FormattedValue value={change.targetValue} level={change.targetLevel} />
              </td>
              <td>
                <FormattedValue value={change.sourceValue} level={change.sourceLevel} />
              </td>

              {/*
              <td>
                &nbsp;
                {!change.compatible && <Icon icon="warning" style={{ color: 'red' }} />}
                {change.warnings.length > 0 && <Icon icon="warning" style={{ color: 'yellow' }} />}
              </td>
              */}
            </tr>
          )
        })}
        </tbody>
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
