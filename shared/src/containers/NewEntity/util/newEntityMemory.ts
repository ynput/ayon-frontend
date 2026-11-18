import { readDialogMemory, writeDialogMemory } from '@shared/util'
import type { NewEntityType } from './entityDefinitions'

// What the New folder / task dialog offers again the next time it opens. The folder and task
// types differ between projects, so they are stored per project; the rest applies everywhere.
const DIALOG = 'new-entity'

type TypeMemory = Partial<Record<`${NewEntityType}Type`, string>>
export type SequenceMemory = {
  increment: string
  length: number
  prefix: boolean
  prefixDepth: number
}
type SharedMemory = { createMore?: boolean; sequence?: SequenceMemory }

export const readRememberedType = (entityType: NewEntityType, projectName: string) =>
  readDialogMemory<TypeMemory>(DIALOG, projectName)[`${entityType}Type`]

export const rememberType = (entityType: NewEntityType, subType: string, projectName: string) =>
  writeDialogMemory<TypeMemory>(DIALOG, { [`${entityType}Type`]: subType }, projectName)

export const readRememberedCreateMore = () => !!readDialogMemory<SharedMemory>(DIALOG).createMore

export const rememberCreateMore = (createMore: boolean) =>
  writeDialogMemory<SharedMemory>(DIALOG, { createMore })

export const readRememberedSequence = () => readDialogMemory<SharedMemory>(DIALOG).sequence

export const rememberSequence = (sequence: SequenceMemory) =>
  writeDialogMemory<SharedMemory>(DIALOG, { sequence })
