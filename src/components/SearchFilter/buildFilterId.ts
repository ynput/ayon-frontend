import { uuid } from 'short-uuid'

export default (name: string) => `${name}_${uuid()}`
