import type { DetailsPanelEntityData } from '@shared/api'

// an all-day event ends at the midnight after its last day: its end date shows that last day
export const isAllDayEndDate = (fieldName: string, entities: DetailsPanelEntityData[]) =>
  fieldName === 'attrib.endDate' &&
  entities.length > 0 &&
  entities.every((entity) => entity.data?.schedulerSyncData?.allDay === true)
