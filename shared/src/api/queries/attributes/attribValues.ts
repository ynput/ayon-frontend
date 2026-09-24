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
