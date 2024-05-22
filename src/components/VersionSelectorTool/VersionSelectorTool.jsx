import {  Dropdown, VersionSelect } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'




const VersionSelectorTool = ({ versions, selected, latest, approved, hero, onChange }) => {
  console.log(versions,'SEL_versions')
  console.log(selected,'SEL_selected')
  console.log(latest,'SEL_latest')
  console.log(approved,'SEL_approved')
  const totalLength = versions?.length
  console.log(totalLength,'totalLength')
  const heroVersion = versions.find((version) => version.name === 'HERO')
  const approvedVersion = versions.find((version) => version.status === 'approved')
  const latestVersion = versions.find((version) => version.status === 'latest')
  const selectedVersion = versions.find((version) => version.id === selected)
  const previousVersionIndex = versions.findIndex((version) => version.id === selectedVersion?.id) - 1
  const previousVersion = previousVersionIndex >= 0 ? versions[previousVersionIndex] : null
  const nextVersionIndex = versions.findIndex((version) => version.id === selectedVersion?.id) + 1
  const nextVersion = nextVersionIndex >= totalLength ?  null : versions[nextVersionIndex]

  const isHeroSelected = selectedVersion.id === heroVersion.id



  console.log(selected,'selectedXX')
  return (
  <Styled.Tools>
    <Styled.VersionButton
      icon="chevron_left"
      onClick={() => onChange(previousVersion.id)}
      data-tooltip="Previous version"
      // data-shortcut="A"
    >
     {previousVersion?.name}
    </Styled.VersionButton>
    <Styled.VersionButton
      onClick={() => console.log('addon')}
      data-tooltip="Selected version"
    >
     {selectedVersion?.name || 'none'}
    </Styled.VersionButton>


    {/* <VersionSelect
      version={selectedVersion.name}
      value={[selectedVersion.name]}
      versions={[...versionNames]}
    >
  </VersionSelect> */}
    {/* <Dropdown
      value={selectedVersion.name}
      options={versions}
      onChange={handleChange}
    >
    </Dropdown> */}


    <Styled.VersionButton
      icon="chevron_right"
      onClick={() => onChange(nextVersion.id)}
      data-tooltip="Next version"
    >
     {nextVersion?.name}
    </Styled.VersionButton>
    <Styled.VersionButton
      data-tooltip="Latest version"
      onClick={()=>onChange(latestVersion.id)}
    > 
     latest {latestVersion.name || 'none'}
    </Styled.VersionButton>
    <Styled.VersionButton
      data-tooltip="Approved version"
      onClick={()=>onChange(approvedVersion.id)}
    > 
     approved {approvedVersion.name || 'none'}
    </Styled.VersionButton>
    <Styled.VersionButton
      style={{  background:  isHeroSelected ? 'blue' : null}}
      disabled={!heroVersion}
      data-tooltip="Hero version"
      onClick={()=>onChange(heroVersion.id)}
    >
     hero {heroVersion.name || 'none'}
    </Styled.VersionButton>

  </Styled.Tools>
  )
}

export default VersionSelectorTool
