import { Dropdown } from '@ynput/ayon-react-components'
import { useMemo, useState } from 'react'
import styled from 'styled-components'

const StyledDropdown = styled(Dropdown)`
  button {
    background-color: unset !important;
    &:hover {
      background-color: var(--md-sys-color-surface-container-low-hover);
    }
    & > div {
      border: none;
      padding: 0px 18px;
    }
  }

  .options {
    width: 110px;
  }
`

const VersionList = ({ row, onSelectVersion, selectedVersions }) => {
  const [currentVersion, setCurrentVersion] = useState(null)

  const options = useMemo(() => {
    if (!row.versionList) return []
    const versions = row.versionList.map((version) => {
      if (version.id === row.versionId) setCurrentVersion(version.id)
      return {
        value: version.id,
        label: version.name,
      }
    })

    // sort alphabetically desc
    const sortedVersions = [...versions].sort((a, b) => b.label.localeCompare(a.label))

    return sortedVersions
  }, [row, selectedVersions])

  // no selected versions? Then select the first one
  const value = currentVersion || options[0]?.value

  const handleOnChange = (v) => {
    const v1 = v[0]
    const selected = options.find((v) => v.value === v1)

    if (!selected) return

    onSelectVersion({
      productId: row.id,
      versionId: selected.value,
      folderId: row.folderId,
      versionName: selected.label,
      currentSelected: selectedVersions,
    })
  }

  return (
    <StyledDropdown
      value={[value]}
      options={options}
      onChange={handleOnChange}
      searchFields={['label']}
      search={options.length > 15}
      dropIcon={null}
      listStyle={{ width: 110 }}
    />
  )
}

export default VersionList
