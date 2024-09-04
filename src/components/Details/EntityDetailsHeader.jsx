import React from 'react'
import PropTypes from 'prop-types'
import DetailHeader from '../DetailHeader'
import StackedThumbnails from '@pages/EditorPage/StackedThumbnails'
import NameField from '@pages/EditorPage/fields/NameField'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { OverflowField } from '@ynput/ayon-react-components'
import copyToClipboard from '@helpers/copyToClipboard'
import { productTypes } from '@state/project'

const ToolsStyled = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  justify-content: end;

  flex: 1;
  margin-right: 1px;
`

const EntityDetailsHeader = ({ values = [], tools, hideThumbnail }) => {
  const { folders, tasks } = useSelector((state) => state.project)
  const changes = useSelector((state) => state.editor.changes)
  const uri = useSelector((state) => state.context.uri)

  if (!values.length) return null

  const isMultiple = values.length > 1

  let subTitle = '',
    breadcrumbs = []
  if (isMultiple) {
    subTitle = values
      .map((v) => v?.name)
      .slice(0, 5)
      .join(', ')

    if (values.length > 5) subTitle += ' +' + (values.length - 5)
  } else if (uri) {
    const [path, qs] = uri.split('://')[1].split('?')
    //eslint-disable-next-line
    const [_, ...bc] = path.split('/').filter((p) => p)
    breadcrumbs = bc
    const qp = qs
      ? qs.split('&').reduce((acc, curr) => {
          if (!curr) return acc
          const [key, value] = curr.split('=')
          acc[key] = value
          return acc
        }, {})
      : {}

    // if (values[0]?.__entityType === 'folder'){
    //   // remove last crumb
    //   breadcrumbs.pop()
    // }

    if (values[0]?.__entityType === 'task') {
      breadcrumbs.push(qp.task)
    } else {
      if (qp.product) breadcrumbs.push(qp.product)
      if (qp.version) breadcrumbs.push(qp.version)
    }

    subTitle = `/ ${breadcrumbs.join(' / ')}`
  }

  const thumbnails = values.map((node) =>
    node ? { id: node.id, type: node.__entityType, updatedAt: node.updatedAt } : {},
  )

  return (
    <DetailHeader>
      {!hideThumbnail && (
        <StackedThumbnails thumbnails={thumbnails} portalId={'editor-entity-details-container'} />
      )}

      <div style={{ overflowX: 'clip', paddingLeft: 3, marginLeft: -3 }}>
        {!isMultiple ? (
          <NameField
            node={values[0]}
            changes={changes}
            styled
            tasks={tasks}
            folders={folders}
            productTypes={productTypes}
            style={{ display: 'flex', gap: 4, fontWeight: 'bold' }}
            iconStyle={{ fontSize: 19, marginRight: 0 }}
            prefix={`${values[0]?.product?.name}`}
          />
        ) : (
          <span style={{ whiteSpace: 'nowrap' }}>Multiple Selected ({values.length})</span>
        )}
        <OverflowField
          value={subTitle}
          style={{ left: -3 }}
          align="left"
          onClick={() => copyToClipboard(breadcrumbs.join('/'), true)}
        />
      </div>

      {tools && <ToolsStyled>{tools}</ToolsStyled>}
    </DetailHeader>
  )
}

EntityDetailsHeader.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
}

export default EntityDetailsHeader
