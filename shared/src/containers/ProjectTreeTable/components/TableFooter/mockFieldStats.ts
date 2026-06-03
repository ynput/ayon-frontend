import { FieldStats } from './mapColumnStats'

// Mock backend response, shaped exactly like `project.folders.fieldStats`
// (GraphQL ColumnStats). Drop-in replacement for the real query result — when
// the backend delivers sum + distribution, delete this and pass the live data.
// Keyed by frontend column id (status/assignees/tags/attrib_*/createdAt/...).
export const mockFieldStats: FieldStats[] = [
  // main count — folders + tasks
  {
    columnName: 'name',
    folderCount: 1599,
    taskCount: 8423,
  },
  // enum / status — colored bars
  {
    columnName: 'status',
    distribution: [
      { value: 'Not ready', count: 320 },
      { value: 'In progress', count: 540 },
      { value: 'Pending review', count: 210 },
      { value: 'Approved', count: 410 },
      { value: 'On hold', count: 119 },
    ],
  },
  // sub type (folder/task type) — colored bars
  {
    columnName: 'subType',
    distribution: [
      { value: 'Asset', count: 700 },
      { value: 'Shot', count: 620 },
      { value: 'Sequence', count: 180 },
      { value: 'Episode', count: 99 },
    ],
  },
  // tags — colored bars
  {
    columnName: 'tags',
    distribution: [
      { value: 'sexy', count: 120 },
      { value: 'fnny', count: 480 },
      { value: 'blip', count: 90 },
      { value: 'blip', count: 10 },
      { value: 'fluffy', count: 220 },
      { value: 'happy', count: 14 },
      { value: 'hairy', count: 15 },
      { value: 'cute', count: 29 },
    ],
  },
  // assignees — same as enum, group-by-user
  {
    columnName: 'assignees',
    distribution: [
      { value: 'Filip', count: 210 },
      { value: 'Luke', count: 180 },
      { value: 'Milan', count: 160 },
      { value: 'Martin', count: 140 },
      { value: 'Marphy', count: 95 },
      { value: 'Jakub', count: 70 },
      { value: 'Jeza', count: 60 },
      { value: 'Admin', count: 45 },
      { value: 'Kuba', count: 30 },
    ],
  },
  // enum attribute
  {
    columnName: 'attrib_priority',
    distribution: [
      { value: 'low', count: 600 },
      { value: 'normal', count: 700 },
      { value: 'high', count: 240 },
      { value: 'urgent', count: 59 },
    ],
  },
  // number attribute — sum/avg/min/max
  {
    columnName: 'attrib_fps',
    sum: 39975,
    avg: 25,
    min: 24,
    max: 60,
  },
  // number attribute
  {
    columnName: 'attrib_frameStart',
    sum: 1601000,
    avg: 1001,
    min: 1001,
    max: 1010,
  },
  // text attribute — filled count
  {
    columnName: 'attrib_description',
    valueFilledCount: 432,
    percentageFilled: 27.02,
    valueNotFilledCount: 1167,
    percentageNotFilled: 72.98,
  },
  // boolean attribute
  {
    columnName: 'attrib_active',
    checkedCount: 1340,
    checkedPercentage: 83.8,
    notCheckedCount: 259,
    notCheckedPercentage: 16.2,
  },
  // datetime — min/max as ISO strings
  {
    columnName: 'createdAt',
    min: '2026-01-12T09:30:00Z',
    max: '2026-06-02T17:45:00Z',
  },
]
