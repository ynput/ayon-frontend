import { v1 as uuid1 } from 'uuid'
export const getEntityId = () => uuid1().replace(/-/g, '')
