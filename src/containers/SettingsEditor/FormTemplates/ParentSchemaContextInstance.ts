import { createContext, useContext } from 'react'
import type { RJSFSchema } from '@rjsf/utils'

// The schema of the object a settings field belongs to, for widgets that depend on a sibling field
export const ParentSchemaContext = createContext<RJSFSchema | null>(null)

export const useParentSchema = () => useContext(ParentSchemaContext)
