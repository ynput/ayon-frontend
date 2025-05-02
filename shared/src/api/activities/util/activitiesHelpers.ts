import { ActivityFragmentFragment, GetEntitiesChecklistsQuery, PageInfo } from '@shared/api'
import { ChecklistCount, FeedActivity, FeedActivityData } from '../types'
import {
  BaseTypes,
  EntityTooltipQuery,
  TaskTypes,
  VersionTypes,
} from '../enhancers/activityQueries'
import { DetailsPanelTab, FeedFilters } from '@shared/context'

// Helper function to get a nested property of an object using a string path
const getNestedProperty = <T extends Record<string, any>, R = any>(
  obj: T,
  path: string,
): R | undefined =>
  path.split('.').reduce<any>((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj)

// Helper function to delete a nested property of an object using a string path
const deleteNestedProperty = <T extends Record<string, any>>(obj: T, path: string): void => {
  const pathParts = path.split('.')
  const lastPart = pathParts.pop()
  const target = pathParts.reduce<any>((o, p) => (o && o[p] !== undefined ? o[p] : undefined), obj)
  if (target && lastPart) {
    delete target[lastPart]
  }
}

function remapNestedProperties<T extends Record<string, any>>(
  object: T,
  remappingItems: Record<string, string>,
): T {
  const transformedObject = { ...object }

  for (const [key, newKey] of Object.entries(remappingItems)) {
    const value = getNestedProperty(transformedObject, key)
    if (value !== undefined) {
      // Get deeply nested value from key using "." notation
      // @ts-expect-error
      transformedObject[newKey] = value
      // Delete the old key from the object
      deleteNestedProperty(transformedObject, key)
    }
  }

  return transformedObject
}

export type ActivitiesResult = { activities: FeedActivity[]; pageInfo: PageInfo }

type TransFormActivityData = (
  edges: { node: ActivityFragmentFragment }[],
  pageInfo: PageInfo,
) => ActivitiesResult

// we flatten the activity object a little bit
export const transformActivityData: TransFormActivityData = (edges = [], pageInfo) => {
  const activities: FeedActivity[] = []

  // loop over each activity and remap the nested properties
  edges.forEach((edge) => {
    // remapping keys are the fields path in the object
    // and the values are the new keys to assign the values to
    const data = edge.node

    if (!data) {
      return
    }

    const activityNode = data

    // remapping of nested properties to flat properties
    const remappingItems = {
      'author.name': 'authorName',
      'author.attrib.fullName': 'authorFullName',
      'author.attrib.avatarUrl': 'authorAvatarUrl',
    }

    const transformedActivity = remapNestedProperties(
      activityNode,
      remappingItems,
    ) as unknown as FeedActivity

    // parse activityData if it's a JSON string
    if (typeof activityNode.activityData === 'string') {
      try {
        transformedActivity.activityData = JSON.parse(activityNode.activityData) as FeedActivityData
      } catch (e) {
        console.error('Error parsing JSON field activityData', activityNode.activityData)
      }
    }

    activities.push(transformedActivity)
  })

  // when there are no activities and hasPreviousPage is false, add an "createdAt" activity as the last activity
  // if (pageInfo.hasPreviousPage === false) {
  //   activities.push({ hasPreviousPage: false, activityType: 'end', activityId: 'end' })
  // }

  return { activities, pageInfo }
}

export type EntityTooltip = {
  id: string
  name: string
  title: string
  type: string
  subTitle: string
  status?: string
  thumbnailId?: string
  updatedAt?: string
  taskType?: string
  users?: { name: string; avatarUrl: string }[]
  path?: string
}
type TransformTaskTooltip = (data: BaseTypes & TaskTypes) => EntityTooltip

const transformTaskTooltip: TransformTaskTooltip = (data) => {
  const { id, label, name, status, thumbnailId, assignees, taskType, updatedAt, folder } =
    data || {}
  const tooltip = {
    id,
    name,
    title: label || name,
    type: 'task',
    subTitle: folder?.label || folder?.name || '',
    status,
    thumbnailId,
    updatedAt,
    taskType,
    users: assignees?.map((name) => ({ name, avatarUrl: `/api/users/${name}/avatar` })) || [],
    path: folder?.path.split('/').splice(-2, 1).join(''),
  }

  return tooltip
}

type TransformVersionTooltip = (data: BaseTypes & VersionTypes) => EntityTooltip

const transformVersionTooltip: TransformVersionTooltip = (data) => {
  const { id, name, status, thumbnailId, author, updatedAt, product } = data
  const tooltip = {
    id,
    type: 'version',
    name: name,
    title: name,
    subTitle: product?.name || '',
    status,
    thumbnailId,
    updatedAt,
    users: [{ name: author || '', avatarUrl: `/api/users/${author}/avatar` }],
    productType: product?.productType,
    path: product?.folder?.path?.split('/').pop(),
  }

  return tooltip
}

// different types have different tooltip data, we need to create a single data model
export const transformTooltipData = (data: EntityTooltipQuery['data']['project'], type: string) => {
  switch (type) {
    case 'task':
      // @ts-ignore
      return transformTaskTooltip(data.task)
    case 'version':
      // @ts-ignore
      return transformVersionTooltip(data.version)
    default:
      return {}
  }
}

type CountCheckLists = (data: GetEntitiesChecklistsQuery) => ChecklistCount

export const countChecklists: CountCheckLists = (data) => {
  const activities = data?.project?.activities?.edges?.map((edge) => edge?.node)
  // get all bodies from each activity
  const bodies = activities.map((a) => a.body)
  const ids = activities.map((a) => a.activityId)

  // count how many checklists are in each body

  // count unchecked * [ ] items
  const unChecked = bodies.reduce((acc, body) => {
    if (!body) return acc
    const matches = body.match(/\*\s\[\s\]/g)
    return acc + (matches ? matches.length : 0)
  }, 0)

  // count checked * [x] items
  const checked = bodies.reduce((acc, body) => {
    if (!body) return acc
    const matches = body.match(/\*\s\[x\]/g)
    return acc + (matches ? matches.length : 0)
  }, 0)

  return { total: unChecked + checked, checked, unChecked, ids }
}

type Task = { id: string }

export const taskProvideTags = (result: Task[], type = 'task', entityType = 'task') =>
  result?.length
    ? [
        ...result.map(({ id }: Task) => ({ type, id })),
        { type, id: entityType.toUpperCase() + 'S' },
        {
          type: `kanBan${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
          id: entityType.toUpperCase() + 'S',
        },
      ]
    : [{ type, id: entityType.toUpperCase() + 'S' }]

export const filterActivityTypes: Record<FeedFilters, string[]> = {
  activity: ['comment', 'version.publish', 'status.change', 'assignee.add', 'assignee.remove'],
  comments: ['comment'],
  versions: ['version.publish'],
  checklists: ['checklist'],
}

export const getFilterActivityTypes = (tab: DetailsPanelTab): string[] | null => {
  // check if the tab is in the filterActivityTypes object1
  if (tab in filterActivityTypes) {
    // @ts-expect-error
    return filterActivityTypes[tab]
  }
  // if not, return null
  return null
}
