import { useMemo } from 'react'

// Define a minimal interface that covers both AttributeField and ProjectTableAttribute
interface AttributeField {
  scope?: string[]
  [key: string]: any
}

interface UseScopedAttributeFieldsProps<T extends AttributeField> {
  attribFields: T[]
  allowedScopes?: string[]
}

export const useScopedAttributeFields = <T extends AttributeField>({
  attribFields,
  allowedScopes = ['task', 'folder'],
}: UseScopedAttributeFieldsProps<T>): T[] => {
  return useMemo(
    () =>
      attribFields.filter((field) =>
        allowedScopes.some((scope) => field.scope?.includes(scope)),
      ),
    [attribFields, allowedScopes],
  )
}
