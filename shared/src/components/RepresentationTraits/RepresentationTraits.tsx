import { FC, ReactNode, useMemo } from 'react'
import { useGetTraitDefinitionsQuery } from '@shared/api'
import type { TraitDefinitions } from '@shared/api'
import { InfoMessage } from '@shared/components/InfoMessage'
import { getRequestErrorString } from '@shared/util'
import * as Styled from './RepresentationTraits.styled'
import { TraitSection } from './TraitSection'
import { SchemaTraitView } from './SchemaTraitView'
import { GenericTraitTable, GenericValue } from './GenericTraitTable'
import { traitWidgets } from './registry'
import {
  buildTraitItems,
  groupTraits,
  hasTraitValues,
  TraitItem,
  TraitView,
} from './utils/traitModel'
import { getFieldSearchName, getSchemaFieldType } from './utils/traitFields'

// Bundles nested deeper than this are shown raw
const MAX_DEPTH = 4
const EMPTY_DEFINITIONS: TraitDefinitions = {}

const TraitBody: FC<{
  item: TraitItem
  view: TraitView
  // traits next to this one, for views that combine traits
  traits: Record<string, unknown>
  renderTraits: (traits: Record<string, unknown>) => ReactNode
}> = ({ item, view, traits, renderTraits }) => {
  const { definition, data } = item
  const Widget = view.widget
    ? traitWidgets[view.widget]?.find((entry) => entry.id === view.id)?.component
    : undefined

  if (view.kind === 'widget' && Widget) {
    return <Widget traitId={item.id} data={data} definition={definition} traits={traits} />
  }
  if (view.kind === 'schema' && definition?.schema) {
    return (
      <SchemaTraitView
        schema={definition.schema}
        value={data}
        renderTraits={renderTraits}
        getFieldSearchName={(field) =>
          // indexed fields can be filtered on, top level only
          getSchemaFieldType(definition.schema?.properties?.[field])
            ? getFieldSearchName(definition.name, field)
            : undefined
        }
      />
    )
  }
  return <GenericTraitTable value={data} />
}

interface TraitListProps {
  traits: Record<string, unknown>
  definitions: TraitDefinitions
  depth: number
}

const TraitList: FC<TraitListProps> = ({ traits, definitions, depth }) => {
  const items = useMemo(
    () => buildTraitItems(traits, definitions, traitWidgets),
    [traits, definitions],
  )
  const groups = useMemo(() => groupTraits(items), [items])

  if (depth >= MAX_DEPTH) return <GenericValue value={traits} depth={1} />

  const missing = items.filter((item) => !item.definition).length
  const renderTraits = (nested: Record<string, unknown>) => (
    <TraitList traits={nested} definitions={definitions} depth={depth + 1} />
  )

  return (
    <Styled.Container>
      {depth === 0 && (
        <Styled.Summary>
          {items.length} {items.length === 1 ? 'trait' : 'traits'}
          {missing > 0 && ` · ${missing} without definition`}
        </Styled.Summary>
      )}
      {groups.map((group) => (
        <Styled.Group key={group.label}>
          {depth === 0 && <h3>{group.label}</h3>}
          {group.items.map((item) => (
            <TraitSection
              key={item.id}
              item={item}
              defaultExpanded={depth === 0 && hasTraitValues(item.data)}
            >
              {(view) => (
                <TraitBody item={item} view={view} traits={traits} renderTraits={renderTraits} />
              )}
            </TraitSection>
          ))}
        </Styled.Group>
      ))}
    </Styled.Container>
  )
}

interface RepresentationTraitsProps {
  // `traits` of a representation: trait id -> trait data
  traits: Record<string, unknown>
}

/** Traits of a representation, shown from the trait definitions provided by addons. */
export const RepresentationTraits: FC<RepresentationTraitsProps> = ({ traits }) => {
  const { data: definitions, isLoading, error } = useGetTraitDefinitionsQuery({})

  // a 404 comes from servers without trait definitions, so there are none
  const notFound = (error as { status?: unknown } | undefined)?.status === 404
  const errorMessage = error && !notFound ? getRequestErrorString(error) : undefined

  if (isLoading) return <Styled.Summary>Loading trait definitions...</Styled.Summary>

  return (
    <Styled.Container>
      {errorMessage && (
        <InfoMessage
          variant="warning"
          compact
          message={`Trait definitions could not be loaded, traits are shown as stored. ${errorMessage}`}
        />
      )}
      <TraitList traits={traits} definitions={definitions || EMPTY_DEFINITIONS} depth={0} />
    </Styled.Container>
  )
}
