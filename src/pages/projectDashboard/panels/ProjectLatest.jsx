import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import EntityGridTile from '/src/components/EntityGridTile'
import { ayonApi } from '/src/services/ayon'
import { useGetEntityTilesQuery } from '/src/services/entity/getEntity'
import { useGetEventsByTopicQuery } from '/src/services/events/getEvents'
import { useGetProjectAnatomyQuery } from '/src/services/getProject'
import { getFamilyIcon } from '/src/utils'
// import { useGetProjectLatestQuery } from '/src/services/getProject'

const GridStyled = styled.div`
  /* 1 row, 3 columns */
  /* columns minWidth 150px, max width 250px */
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  grid-template-rows: auto;
  /* grid-auto-rows: 0; */
  overflow-y: clip;
  grid-gap: 8px;
  row-gap: 8px;
`

const ProjectLatest = ({ projectName }) => {
  const dispatch = useDispatch()
  //   const { data = {}, isLoading, isError } = useGetProjectLatestQuery({ projectName })

  // TODO: clean up this mess up
  // get project anatomy for project name for status
  const { data: anatomy = {} } = useGetProjectAnatomyQuery({
    projectName,
  })

  //   create topics array
  const entityTypes = ['subset', 'version', 'folder', 'task']
  const events = ['status_changed', 'created', 'attrib_changed']
  // topic = entity.[entity].[event]
  const topics = []
  for (const entity of entityTypes) {
    for (const event of events) {
      topics.push(`entity.${entity}.${event}`)
    }
  }

  // number of events to get state
  const [numEvents, setNumEvents] = useState(4)

  //  get latest events for project and topics
  const {
    data: eventsData = [],
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
    isFetching: isFetchingEvents,
  } = useGetEventsByTopicQuery({
    projects: [projectName],
    topics,
    last: numEvents,
  })

  // log the events
  // console.log({ eventsData })

  //   get summary.id for each event
  // events loading state
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  // data state
  const [eventData, setEntityData] = useState([])

  // aync func that gets the entity id for each event
  const getEntityIds = async (events) => {
    try {
      const eventsDataPromises = []
      for (const { id } of events) {
        const promises = dispatch(ayonApi.endpoints.getEventById.initiate({ id }))
        eventsDataPromises.push(promises)
      }

      const eventsData = await Promise.all(eventsDataPromises)
      return eventsData
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (!isLoadingEvents && !isErrorEvents && !isFetchingEvents) {
      setIsEventsLoading(true)
      getEntityIds(eventsData)
        .then((data) => {
          setEntityData(data)
          setIsEventsLoading(false)
        })
        .catch((error) => console.error(error))
    }
  }, [isLoadingEvents, isErrorEvents, isFetchingEvents])

  // create entityIds object with entity type as key and array of entity ids as value
  // { subset: [id1, id2, id3], version: [id1, id2, id3] }
  const entityIds = {}
  const uniqueEntityIds = []
  for (let { data } of eventData) {
    data = data || {}
    const { summary = {}, topic } = data
    const { entityId } = summary

    // check if entity id is unique
    if (entityId && uniqueEntityIds.includes(entityId)) continue

    uniqueEntityIds.push(entityId)

    if (entityId && topic) {
      // split topic to get type
      let [, type] = topic.split('.')
      // add to entityIds
      if (entityIds[type]) {
        entityIds[type].push(entityId)
      } else {
        entityIds[type] = [entityId]
      }
    }
  }

  console.log({ uniqueEntityIds })

  useEffect(() => {
    // check unique entity ids length is at least 3
    if (uniqueEntityIds.length < 3 && !isEventsLoading && !isFetchingEvents && numEvents < 20) {
      // this is when the latest events are for the same entity
      // so we need to get more events
      // this will cause a re fetch of the events with a higher last value
      setNumEvents(numEvents + 1)
    }
  }, [uniqueEntityIds, numEvents, isEventsLoading, isFetchingEvents])

  // get entity tiles data for each entity type
  // [entity1, entity2, entity3]
  let { data = [{}, {}, {}], isError } = useGetEntityTilesQuery(
    {
      projectName,
      entities: entityIds,
    },
    { skip: isEventsLoading || isErrorEvents },
  )

  function transformArrayToObject(anatomy, propertyName) {
    return anatomy?.[propertyName]?.reduce((acc, item) => {
      acc[item.name] = item
      return acc
    }, {})
  }

  const statusObject = transformArrayToObject(anatomy, 'statuses')
  const folderTypesObject = transformArrayToObject(anatomy, 'folder_types')
  const taskTypesObject = transformArrayToObject(anatomy, 'task_types')

  data = data.map((entity) => {
    let { type, icon, status } = entity
    let typeIcon = ''

    if (type === 'subset' || type === 'version') {
      typeIcon = getFamilyIcon(icon)
    } else if (type === 'folder') {
      typeIcon = folderTypesObject?.[icon]?.icon
    } else if (type === 'task') {
      typeIcon = taskTypesObject?.[icon]?.icon
    }

    const statusIcon = statusObject?.[status]?.icon
    const statusColor = statusObject?.[status]?.color

    return { ...entity, typeIcon, statusIcon, statusColor, projectName }
  })

  // console.log({ data })

  return (
    <DashboardPanelWrapper isError={isError} title="Latest">
      <h2>Recent Activity</h2>
      <GridStyled>
        {data.map((entity, index) => (
          <EntityGridTile key={`${entity.id}-${index}`} {...entity} />
        ))}
      </GridStyled>
    </DashboardPanelWrapper>
  )
}

export default ProjectLatest
