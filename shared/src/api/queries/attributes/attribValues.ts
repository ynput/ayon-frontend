/**
 * The GraphQL `attrib` field of entities is an untyped JSON object,
 * because attributes can be added, changed and removed on the server at runtime.
 * Use `attrib(names: [...])` in queries to get only the attributes you need.
 *
 * These helpers type the attribute values using the attribute models
 * of the REST API (e.g. `UserAttribModel`, `TaskAttribModel`).
 */

export type AttribValues = Record<string, unknown>

/** Attribute values typed by the given attribute model (all attributes optional) */
export type TypedAttrib<T extends object = AttribValues> = Partial<T>

/** Type the attribute values of a GraphQL `attrib` field */
export const getAttrib = <T extends object = AttribValues>(attrib: unknown): TypedAttrib<T> =>
  (attrib && typeof attrib === 'object' ? attrib : {}) as TypedAttrib<T>

/**
 * Attribute values of an `attrib(names: [...])` field without the empty ones.
 * Requested attributes without a value are returned as null, `allAttrib` leaves them out:
 * dropping them keeps `name in attrib` checks working the same way.
 */
export const getSetAttrib = (attrib: unknown): Record<string, any> => {
  const values: Record<string, any> = {}
  for (const [name, value] of Object.entries(getAttrib(attrib))) {
    if (value !== null && value !== undefined) values[name] = value
  }
  return values
}
