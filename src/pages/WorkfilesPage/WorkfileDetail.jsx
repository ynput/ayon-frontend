import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '@containers/fieldFormat'
import { Thumbnail } from '@shared/components'
import NoEntityFound from '@components/NoEntityFound'
import AttributeTable from '@containers/attributeTable'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetWorkfileByIdQuery } from '@queries/getWorkfiles'
import { useGetSiteRootsQuery } from '@queries/customRoots'
import SiteDropdown from '@containers/SiteDropdown'
import { getCurrentPlatform, replaceRoot, useRegisterActiveEntities } from '@shared/util'
import { useProjectContext } from '@shared/context'

const WorkfileDetail = ({ style }) => {
  const { projectName } = useProjectContext()
  const focusedWorkfiles = useSelector((state) => state.context.focused.workfiles)
  const taskIds = useSelector((state) => state.context.focused.tasks)
  const [selectedSite, setSelectedSite] = useState(null)

  const firstFocusedWorkfile = focusedWorkfiles[0]

  // make the selection available to global features (the links dialog)
  useRegisterActiveEntities(
    focusedWorkfiles.map((id) => ({ id, entityType: 'workfile', projectName })),
  )

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

  if (!firstFocusedWorkfile) {
    return (
      <Section style={style}>
        <Panel style={{ flex: 1, position: 'relative' }}>
          <NoEntityFound
            type="workfile"
            label="Select a workfile to see its details"
            muted={!taskIds.length}
          />
        </Panel>
      </Section>
    )
  }

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
