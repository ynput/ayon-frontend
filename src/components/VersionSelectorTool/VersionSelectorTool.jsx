import {  Dropdown, VersionSelect } from '@ynput/ayon-react-components'
import * as Styled from './VersionSelectorTool.styled'




const VersionSelectorTool = ({ versions, selected, latest, approved, hero, onChange }) => {
  console.log(versions,'SEL_versions')
  console.log(selected,'SEL_selected')
  console.log(latest,'SEL_latest')
  console.log(approved,'SEL_approved')
  const heroVersion = versions.find((version) => version.hero)
  const approvedVersion = versions.find((version) => version.status === 'approved')
  const selectedVersion = versions.find((version) => version.status === 'selected')
  // const handleChange = () => console.log('test')

  const versionNames = versions.map((version) => version.name)

  console.log(versionNames,'versionNames')
  return (
  <Styled.Tools>
    <Styled.VersionButton
      icon="chevron_left"
      onClick={() => console.log('addon')}
      data-tooltip="Previous version"
      // data-shortcut="A"
    >
      <span className="large">Previous</span>
    </Styled.VersionButton>
    <VersionSelect
      version={selectedVersion.name}
      value={[selectedVersion.name]}
      versions={[...versionNames]}
      // onChange={handleChange}
    >
      <span className="large">Previous</span>
    </VersionSelect>
    <Styled.VersionButton
      icon="chevron_right"
      onClick={() => console.log('addon')}
      data-tooltip="Install addon zip files"
      data-shortcut="A"
    >
      <span className="large">Next</span>
    </Styled.VersionButton>
    <Styled.VersionButton
      data-tooltip="Approved version"
    >
      <span className="large">approved: {approvedVersion.name || 'none'}</span>
    </Styled.VersionButton>
    <Styled.VersionButton
      disabled={!heroVersion}
      data-tooltip="Hero version"
    >
      <span className="large">{heroVersion.name || 'Hero none'}</span>
    </Styled.VersionButton>

  </Styled.Tools>
  )
}

export default VersionSelectorTool
