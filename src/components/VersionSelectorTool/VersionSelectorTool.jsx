import {  Dropdown, VersionSelect } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'




const VersionSelectorTool = ({ versions, selected = [], latest, approved, hero, onChange }) => {
  console.log(versions,'SEL_versions')
  console.log(selected,'SEL_selected')
  console.log(latest,'SEL_latest')
  console.log(approved,'SEL_approved')
  const totalLength = versions?.length
  console.log(totalLength,'totalLength')

  const heroVersion = versions.find((version) => version.name === 'HERO')
  const approvedVersion = versions.find((version) => version.status === 'approved')
  const latestVersion = versions.find((version) => version.status === 'latest')
  
  const selectedVersion = versions.find((version) => version.id === selected[0])

  const previousVersionIndex = versions.findIndex((version) => version.id === selectedVersion?.id) - 1
  const previousVersion = previousVersionIndex >= 0 ? versions[previousVersionIndex] : null
  const nextVersionIndex = versions.findIndex((version) => version.id === selectedVersion?.id) + 1
  const nextVersion = nextVersionIndex >= totalLength ?  null : versions[nextVersionIndex]

  const isHeroSelected = selectedVersion?.id === heroVersion?.id
  const isLatestSelected = selectedVersion?.id === latestVersion?.id
  const isApprovedSelected = selectedVersion?.id === approvedVersion?.id

  return (
  <Styled.Tools>
    <Styled.VersionButton
      icon="chevron_left"
      onClick={() => onChange(previousVersion.id)}
      data-tooltip="Previous version"
      disabled={!previousVersion}
      // data-shortcut="A"
    >
     {previousVersion?.name || 'None'}
    </Styled.VersionButton>
    <Dropdown
      style={{ height: '36px'}}
      value={selected} // always array
      options={versions}
      dataKey={'id'}
      labelKey={'name'}
      onChange={(val) => onChange(val[0])}
      valueTemplate={() => (
        <Styled.VersionButton>
            {selectedVersion?.name || 'None'}
        </Styled.VersionButton>
      )}
    >
    </Dropdown>
    <Styled.VersionButton
      icon="chevron_right"
      onClick={() => onChange(nextVersion.id)}
      data-tooltip="Next version"
      disabled={!nextVersion}
    >
     {nextVersion?.name || 'None'}
    </Styled.VersionButton>
    <Styled.VersionButton
      $isSelected={!!isLatestSelected}
      data-tooltip="Latest version"
      onClick={()=>onChange(latestVersion.id)}
    > 
     latest {latestVersion.name || 'None'}
    </Styled.VersionButton>
    <Styled.VersionButton
      $isSelected={!!isApprovedSelected}
      data-tooltip="Approved version"
      onClick={()=>onChange(approvedVersion.id)}
    > 
     approved {approvedVersion.name || 'None'}
    </Styled.VersionButton>
    <Styled.VersionButton
      $isSelected={!!isHeroSelected}
      disabled={!heroVersion}
      data-tooltip="Hero version"
      onClick={()=>onChange(heroVersion.id)}
    >
     hero {heroVersion?.name || 'None'}
    </Styled.VersionButton>

  </Styled.Tools>
  )
}

export default VersionSelectorTool
