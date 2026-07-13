import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '@containers/fieldFormat'
import { Thumbnail } from '@shared/components'
import AttributeTable from '@containers/attributeTable'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetWorkfileByIdQuery } from '@queries/getWorkfiles'
import { useGetSiteRootsQuery } from '@queries/customRoots'
import SiteDropdown from '@containers/SiteDropdown'
import { getCurrentPlatform, replaceRoot } from '@shared/util'

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
