import type { FormFileData } from './FormFile'

export type SimpleFormValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | FormFileData
  | null
  | undefined

export type SimpleFormValueDict = Record<string, SimpleFormValue>
