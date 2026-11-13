// A version's built-in attributes describe what was published, so they stay read-only wherever
// the version is edited (#1504); its custom attributes and every other entity's stay editable
export const isEntityAttribLocked = (
  entityType: string | undefined,
  attrib: { builtin?: boolean | null } | undefined,
) => entityType === 'version' && !!attrib?.builtin
