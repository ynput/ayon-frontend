import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useGetEnumOptionsQuery } from '@shared/api'
import { getEnumItemIcon } from '@shared/util/attributeEnum'
import type { AttributeData, EnumItem } from '@shared/api'

const EMPTY_OPTIONS: EnumItem[] = []

export interface UseAttributeEnumOptionsParams {
  projectName?: string
  skip?: boolean
}

export interface AttributeEnumState {
  options: EnumItem[]
  isLoading: boolean
  isError: boolean
}

// Options for one attribute: static data.enum, or resolved through the backend enum registry.
export const useAttributeEnumOptions = (
  data: AttributeData | undefined,
  { projectName, skip }: UseAttributeEnumOptionsParams = {},
): AttributeEnumState => {
  const resolver = data?.enumResolver

  // project_name last: it is the live page scope and must win over saved settings
  const params = useMemo(
    () => ({
      ...((data?.enumResolverSettings as Record<string, any>) || {}),
      project_name: projectName,
    }),
    [projectName, data?.enumResolverSettings],
  )

  const {
    data: resolved,
    isFetching,
    isError,
  } = useGetEnumOptionsQuery(
    { enumName: resolver as string, params },
    { skip: !resolver || !!skip },
  )

  // Identity must stay stable across renders: subscribers report options upwards.
  const options = useMemo(() => {
    if (!resolver) return data?.enum || EMPTY_OPTIONS
    if (!resolved) return EMPTY_OPTIONS
    // resolvers may return an IconModel, widgets expect a plain icon string
    return resolved.map((item) => ({ ...item, icon: getEnumItemIcon(item.icon) }))
  }, [resolver, resolved, data?.enum])

  return { options, isLoading: !!resolver && isFetching, isError: !!resolver && isError }
}

export interface EnumAttributeLike {
  name: string
  data?: AttributeData
}

type OnResolved = (name: string, state: AttributeEnumState) => void

interface SubscriptionProps {
  attribute: EnumAttributeLike
  projectName?: string
  onResolved: OnResolved
}

const AttributeEnumSubscription: FC<SubscriptionProps> = ({
  attribute,
  projectName,
  onResolved,
}) => {
  const state = useAttributeEnumOptions(attribute.data, { projectName })

  useEffect(() => {
    onResolved(attribute.name, state)
  }, [attribute.name, state.options, state.isLoading, state.isError, onResolved])

  return null
}

export interface AttributeEnumResolverProps {
  attributes: EnumAttributeLike[]
  projectName?: string
  onResolved: OnResolved
}

// One subscription per dynamic attribute, feeding non component consumers
export const AttributeEnumResolver: FC<AttributeEnumResolverProps> = ({
  attributes,
  projectName,
  onResolved,
}) => (
  <>
    {attributes
      .filter((attribute) => !!attribute.data?.enumResolver)
      .map((attribute) => (
        <AttributeEnumSubscription
          key={attribute.name}
          attribute={attribute}
          projectName={projectName}
          onResolved={onResolved}
        />
      ))}
  </>
)

export type ResolvedEnumAttribute<T> = T & {
  enumIsLoading?: boolean
  enumHasError?: boolean
}

// Single place that merges resolved options back into an attribute list.
export const useResolvedAttributeEnums = <T extends EnumAttributeLike>(
  attributes: T[],
  projectName?: string,
) => {
  const [states, setStates] = useState<Record<string, AttributeEnumState>>({})

  const handleResolved = useCallback<OnResolved>((name, state) => {
    setStates((current) => {
      const previous = current[name]
      if (
        previous &&
        previous.options === state.options &&
        previous.isLoading === state.isLoading &&
        previous.isError === state.isError
      ) {
        return current
      }
      return { ...current, [name]: state }
    })
  }, [])

  const resolvedAttributes = useMemo(
    () =>
      attributes.map((attribute): ResolvedEnumAttribute<T> => {
        if (!attribute.data?.enumResolver) return attribute
        const state = states[attribute.name]
        return {
          ...attribute,
          enumIsLoading: state ? state.isLoading : true,
          enumHasError: !!state?.isError,
          data: { ...attribute.data, enum: state?.options || EMPTY_OPTIONS },
        }
      }),
    [attributes, states],
  )

  const enumSubscriptions = (
    <AttributeEnumResolver
      attributes={attributes}
      projectName={projectName}
      onResolved={handleResolved}
    />
  )

  return { attributes: resolvedAttributes, enumStates: states, enumSubscriptions }
}
