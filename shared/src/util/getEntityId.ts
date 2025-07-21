import { v1 as uuid1 } from 'uuid'
export const getEntityId = () => uuid1().replace(/-/g, '')
export const validateEntityId = (id: string): boolean => {
  // A valid entity ID is a UUID without dashes
  const uuidRegex = /^[0-9a-f]{32}$/i
  return uuidRegex.test(id)
}
