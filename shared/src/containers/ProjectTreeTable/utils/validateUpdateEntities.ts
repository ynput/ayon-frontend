import { AttributeData, AttributeWithPermissions } from '../types'
import { EntityUpdate } from '../hooks/useUpdateTableData'

const validateUpdateEntities = (
  entities: EntityUpdate[] = [],
  attribFields: AttributeWithPermissions[],
) => {
  // first validate the values are correct
  for (const { isAttrib, value: rawValue, field } of entities) {
    if (!isAttrib) continue
    const attribute = attribFields.find((attr) => attr.name === field)
    if (!attribute) continue

    // coerce numeric strings into numbers for integer/float types or fail
    let value: any = rawValue
    const { type } = attribute.data
    if (type === 'integer' || type === 'float') {
      if (typeof rawValue === 'string') {
        // empty or non‑numeric strings are invalid
        if (rawValue.trim() === '' || isNaN(Number(rawValue))) {
          throw new Error(`“${field}” must be a valid number`)
        }
        value = type === 'integer' ? parseInt(rawValue, 10) : parseFloat(rawValue)
      } else if (typeof rawValue !== 'number') {
        // any other type is invalid
        throw new Error(`“${field}” must be a valid number`)
      }
    }

    // collect numeric rules from attribute.data
    const validationKeys: (keyof AttributeData)[] = [
      'ge',
      'gt',
      'le',
      'lt',
      'minLength',
      'maxLength',
      'minItems',
      'maxItems',
    ]
    const validationValues = (
      Object.entries(attribute.data) as [keyof AttributeData, any][]
    ).reduce((acc, [key, v]) => {
      if (validationKeys.includes(key)) acc[key] = v as number
      return acc
    }, {} as Record<keyof AttributeData, number>)

    const { ge, gt, le, lt, minLength, maxLength, minItems, maxItems } = validationValues
    const pattern = attribute.data.regex

    if (typeof value === 'number') {
      if (ge != null && value < ge) throw new Error(`“${field}” must be ≥ ${ge}`)
      if (gt != null && value <= gt) throw new Error(`“${field}” must be > ${gt}`)
      if (le != null && value > le) throw new Error(`“${field}” must be ≤ ${le}`)
      if (lt != null && value >= lt) throw new Error(`“${field}” must be < ${lt}`)
    } else if (typeof value === 'string') {
      if (minLength != null && value.length < minLength)
        throw new Error(`“${field}” length must be ≥ ${minLength}`)
      if (maxLength != null && value.length > maxLength)
        throw new Error(`“${field}” length must be ≤ ${maxLength}`)
      if (pattern && !new RegExp(pattern).test(value))
        throw new Error(`“${field}” must match pattern ${pattern}`)
    } else if (Array.isArray(value)) {
      if (minItems != null && value.length < minItems)
        throw new Error(`“${field}” items must be ≥ ${minItems}`)
      if (maxItems != null && value.length > maxItems)
        throw new Error(`“${field}” items must be ≤ ${maxItems}`)
    }
  }
}

export default validateUpdateEntities
