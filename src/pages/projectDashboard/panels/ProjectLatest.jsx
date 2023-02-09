import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { ayonApi } from '/src/services/ayon'
import { useGetEntityTilesQuery } from '/src/services/entity/getEntity'
import { useGetEventsByTopicQuery } from '/src/services/events/getEvents'
// import { useGetProjectLatestQuery } from '/src/services/getProject'

const ProjectLatest = ({ projectName }) => {
  const dispatch = useDispatch()
  //   const { data = {}, isLoading, isError } = useGetProjectLatestQuery({ projectName })

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

  //  get latest events for project and topics
  const {
    data: eventsData,
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
  } = useGetEventsByTopicQuery({
    projects: [projectName],
    topics,
    last: 3,
  })

  // log the events
  // console.log({ eventsData })

  //   get summary.id for each event
  // events loading state
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  // data state
  const [eventData, setEntityData] = useState([])

  useEffect(() => {
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

    if (!isLoadingEvents && !isErrorEvents) {
      getEntityIds(eventsData)
        .then((data) => {
          setEntityData(data)
          setIsEventsLoading(false)
        })
        .catch((error) => console.error(error))
    }
  }, [isLoadingEvents, isErrorEvents])

  // create entityIds object with entity type as key and array of entity ids as value
  // { subset: [id1, id2, id3], version: [id1, id2, id3] }
  const entityIds = {}
  for (let { data } of eventData) {
    data = data || {}
    const { summary = {}, topic } = data
    const { entityId } = summary

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

  // get entity tiles data for each entity type
  // [entity1, entity2, entity3]
  const { data, isError } = useGetEntityTilesQuery(
    {
      projectName,
      entities: entityIds,
    },
    { skip: isEventsLoading || isErrorEvents },
  )

  console.log(data)

  return (
    <DashboardPanelWrapper isError={isError} title="Latest">
      hello
    </DashboardPanelWrapper>
  )
}

export default ProjectLatest
