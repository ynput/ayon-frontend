import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '@containers/fieldFormat'
import NoEntityFound from '@components/NoEntityFound'
import AttributeTable from '@containers/attributeTable'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetWorkfileByIdQuery, useGetWorkfileListQuery } from '@queries/getWorkfiles'
import { useGetSiteRootsQuery } from '@queries/customRoots'
import SiteDropdown from '@containers/SiteDropdown'
import {
  getCurrentPlatform,
  getEntityTypeIcon,
  replaceRoot,
  useRegisterActiveEntities,
} from '@shared/util'
import { useProjectContext } from '@shared/context'
import * as Styled from './WorkfileDetail.styled'

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

  // the workfile list's query with the same args, so it comes from the cache:
  // the prompt stays muted while there is no workfile to pick
  const { data: taskWorkfiles = [], isFetching: isFetchingWorkfiles } = useGetWorkfileListQuery(
    { projectName, taskIds },
    { skip: !taskIds.length },
  )
  const noWorkfilesToPick = !taskIds.length || (!isFetchingWorkfiles && !taskWorkfiles.length)

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
            muted={noWorkfilesToPick}
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
            <Styled.WorkfileThumbnail
              projectName={projectName}
              entityType="workfile"
              entityId={firstFocusedWorkfile}
              icon={getEntityTypeIcon('workfile')}
            />

            <Styled.Attributes>
              <AttributeTable
                entityType="workfile"
                data={data?.attrib || {}}
                additionalData={[
                  {
                    title: 'Path for site',
                    value: (
                      <SiteDropdown value={selectedSite} onChange={setSelectedSite} allowNull />
                    ),
                  },
                  {
                    title: 'Path',
                    value: <PathField value={path} />,
                  },
                ]}
              />
            </Styled.Attributes>
          </>
        )}
      </Panel>
    </Section>
  )
}

export default WorkfileDetail
