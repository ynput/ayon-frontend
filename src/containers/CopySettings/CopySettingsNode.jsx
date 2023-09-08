/* eslint-disable */
import { useState } from 'react'

import styled from 'styled-components'

import { Icon } from '@ynput/ayon-react-components'

import VariantSelector from '/src/containers/AddonSettings/VariantSelector'
import ProjectDropdown from '/src/containers/CopySettings/ProjectDropdown'
import AddonDropdown from '/src/containers/CopySettings/AddonDropdown'

const NodePanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flexgrow: 1;
  border-radius: 4px;
`

const NodePanelHeader = styled.div`
  padding: 4px 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: var(--color-grey-02);
  min-height: 40px;
  max-height: 40px;

  .dropdown {
    min-width: 200px;
    max-width: 200px;
  }

  border-radius: 4px;

  &.expanded {
    border-radius: 4px 4px 0 0;
`

const NodePanelToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border: 1px solid #ccc;
`

const NodePanelBody = styled.div`
  display: flex;
  flex-direction: column;
  border-radius: 0 0 4px 4px;
  border: 1px solid var(--color-grey-02);
  min-height: 100px;
`

const NodePanelDirectionSelector = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;

  .icon {
    font-size: 4rem;
    border-radius: var(--border-radius-m);
    user-select: none;
  }
`

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
  const [expanded, setExpanded] = useState(false)

  const toggleIcon = expanded ? 'expand_more' : 'chevron_right'

  const onToggle = () => setExpanded(!expanded)

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
        <Icon icon="trending_flat" />
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

  const body = <NodePanelBody>something here</NodePanelBody>

  return (
    <NodePanelWrapper className={expanded ? 'expanded' : undefined}>
      {header}
      {expanded && body}
    </NodePanelWrapper>
  )
}

export default CopySettingsNode
