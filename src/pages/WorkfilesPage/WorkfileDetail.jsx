import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '@containers/fieldFormat'
import Thumbnail from '@components/Thumbnail'
import AttributeTable from '@containers/attributeTable'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetWorkfileByIdQuery } from '@queries/getWorkfiles'
import { useGetSiteRootsQuery } from '@queries/customRoots'
import SiteDropdown from '@containers/SiteDropdown'
import { getCurrentPlatform } from '@helpers/platform'


const replaceRoot = (inputStr, replacements) => {
  if (!inputStr) return inputStr
  return inputStr.replace(/\{root\[(.*?)\]\}/g, function (match, p1) {
    //TODO: fix eslint error
    //eslint-disable-next-line
    if (replacements.hasOwnProperty(p1)) {
      let value = replacements[p1]
      // strip forward and back slashes from the end of the value
      value = value.replace(/\/$/, '')
      return value
    }
    return match
  })
}

const WorkfileDetail = ({ style }) => {
  const projectName = useSelector((state) => state.project.name)
  const focusedWorkfiles = useSelector((state) => state.context.focused.workfiles)
  const [selectedSite, setSelectedSite] = useState(null)

  const firstFocusedWorkfile = focusedWorkfiles[0]

  const { data = {}, isLoading } = useGetWorkfileByIdQuery(
    { projectName, id: firstFocusedWorkfile },
    { skip: !firstFocusedWorkfile },
  )

  const platform = getCurrentPlatform()
  const { data: rootsData = {} } = useGetSiteRootsQuery({
    projectName,
    siteId: selectedSite,
    platform,
  })

  let path = Object.keys(rootsData).length ? replaceRoot(data?.path, rootsData) : data?.path

  return (
    <Section style={style}>
      <Panel>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <Thumbnail
              projectName={projectName}
              entityType="workfile"
              entityId={firstFocusedWorkfile}
              entityUpdatedAt={data?.updatedAt}
            />

            <AttributeTable
              entityType="workfile"
              data={data?.attrib || {}}
              additionalData={[
                {
                  title: 'Path for site',
                  value: <SiteDropdown value={selectedSite} onChange={setSelectedSite} allowNull />,
                },
                {
                  title: 'Path',
                  value: <PathField value={path} />,
                },
              ]}
            />
          </>
        )}
      </Panel>
    </Section>
  )
}

export default WorkfileDetail
