import { FC, ReactNode } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import type { TraitJsonSchema } from '@shared/api'
import * as Styled from './RepresentationTraits.styled'
import { GenericValue, LongText } from './GenericTraitTable'
import { isPlainObject } from './utils/traitModel'
import {
  formatScalar,
  getItemSchema,
  getSchemaFields,
  getValueKind,
  isScalar,
} from './utils/schemaFields'

// nested traits (Bundle items in bundles) deeper than this are shown raw
const MAX_DEPTH = 6

type RenderTraits = (traits: Record<string, unknown>) => ReactNode

interface SchemaProps {
  schema: TraitJsonSchema
  value: unknown
  root: TraitJsonSchema
  renderTraits: RenderTraits
  depth: number
}

const SchemaValue: FC<SchemaProps> = ({ schema, value, root, renderTraits, depth }) => {
  const kind = getValueKind(schema, value)

  switch (kind) {
    case 'empty':
      return <Styled.Empty>Not set</Styled.Empty>
    case 'string':
      return value === '' ? <Styled.Empty>Empty</Styled.Empty> : <LongText text={String(value)} />
    case 'path':
    case 'regex':
      return <Styled.Code>{String(value)}</Styled.Code>
    case 'enum':
      return <Styled.Tag>{formatScalar(value)}</Styled.Tag>
    case 'traits':
      if (depth >= MAX_DEPTH) return <GenericValue value={value} />
      return <>{renderTraits(value as Record<string, unknown>)}</>
    case 'object':
      // a dict has no properties, only its values are described
      if (!schema.properties) return <GenericValue value={value} depth={1} />
      return (
        <SchemaFields
          schema={schema}
          value={value}
          root={root}
          renderTraits={renderTraits}
          depth={depth + 1}
        />
      )
    case 'array':
    case 'tuple': {
      const items = value as unknown[]
      if (!items.length) return <Styled.Empty>Empty</Styled.Empty>

      const itemSchemas = items.map((item, index) => getItemSchema(schema, index, item, root))
      const inline = items.every(
        (item, index) => isScalar(item) && !itemSchemas[index].format && item !== '',
      )
      if (inline) {
        return (
          <Styled.InlineList>
            {items.map((item, index) => (
              <Styled.Tag key={index}>{formatScalar(item)}</Styled.Tag>
            ))}
          </Styled.InlineList>
        )
      }
      return (
        <Styled.List>
          {items.map((item, index) => (
            <li key={index}>
              <SchemaValue
                schema={itemSchemas[index]}
                value={item}
                root={root}
                renderTraits={renderTraits}
                depth={depth + 1}
              />
            </li>
          ))}
        </Styled.List>
      )
    }
    default:
      return <>{formatScalar(value)}</>
  }
}

const SchemaFields: FC<SchemaProps> = ({ schema, value, root, renderTraits, depth }) => {
  if (!isPlainObject(value)) return <GenericValue value={value} />

  const fields = getSchemaFields(schema, value, root)
  if (!fields.length) return <Styled.Empty>No values</Styled.Empty>

  return (
    <Styled.FieldTable>
      <tbody>
        {fields.map((field) => (
          <tr key={field.key}>
            <td
              className={clsx('label', { extra: !field.inSchema })}
              data-tooltip={field.inSchema ? field.description : 'Not in the trait definition'}
            >
              {field.label}
              {!field.matches && (
                <span data-tooltip="The stored value does not match the trait definition">
                  <Icon icon="warning" className="mismatch" />
                </span>
              )}
            </td>
            <td className="value">
              {field.inSchema && field.matches ? (
                <SchemaValue
                  schema={field.schema}
                  value={field.value}
                  root={root}
                  renderTraits={renderTraits}
                  depth={depth}
                />
              ) : (
                <GenericValue value={field.value} depth={1} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Styled.FieldTable>
  )
}

interface SchemaTraitViewProps {
  // JSON Schema of the trait from its definition
  schema: TraitJsonSchema
  value: unknown
  // renders traits nested in the value (Bundle items)
  renderTraits: RenderTraits
  depth?: number
}

/** Shows a trait with labels, descriptions and nesting from its definition. */
export const SchemaTraitView: FC<SchemaTraitViewProps> = ({
  schema,
  value,
  renderTraits,
  depth = 0,
}) => (
  <SchemaFields
    schema={schema}
    value={value}
    root={schema}
    renderTraits={renderTraits}
    depth={depth}
  />
)
