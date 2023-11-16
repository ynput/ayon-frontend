import React from 'react'
import PropTypes from 'prop-types'
import DetailHeader from '../DetailHeader'
import StackedThumbnails from '/src/pages/EditorPage/StackedThumbnails'
import NameField from '/src/pages/EditorPage/fields/NameField'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { OverflowField } from '@ynput/ayon-react-components'
import copyToClipboard from '/src/helpers/copyToClipboard'
import getShimmerStyles from '/src/styles/getShimmerStyles'

const ToolsStyled = styled.div`
  display: flex;
  gap: 4px;
  justify-content: end;

  flex: 1;
  margin-right: 1px;
`

const StyledLoading = styled.div`
  width: 100%;
  height: 37px;
  border-radius: var(--border-radius-m);
  position: relative;

  ${getShimmerStyles()}
`

const EntityDetailsHeader = ({
  values = [],
  tools,
  isLoading,
  hideThumbnail,
  onThumbnailUpload,
}) => {
  const { folders, tasks, productTypes } = useSelector((state) => state.project)
  const changes = useSelector((state) => state.editor.changes)
  const uri = useSelector((state) => state.context.uri)

  if (!values.length) return null

  const isMultiple = values.length > 1

  let subTitle = ''
  if (isMultiple) {
    subTitle = values.map((v) => v?.name).join(', ')
  } else if (uri) {
    const [path, qs] = uri.split('://')[1].split('?')
    //eslint-disable-next-line
    const [_, ...breadcrumbs] = path.split('/').filter((p) => p)
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
        <StackedThumbnails
          thumbnails={thumbnails}
          isLoading={isLoading}
          onUpload={onThumbnailUpload}
          portalId={'editor-entity-details-container'}
        />
      )}
      {isLoading ? (
        <StyledLoading />
      ) : (
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
            <h2>Multiple Selected ({values.length})</h2>
          )}
          <OverflowField
            value={subTitle}
            style={{ left: -3 }}
            align="left"
            onClick={copyToClipboard}
          />
        </div>
      )}
      {tools && <ToolsStyled>{tools}</ToolsStyled>}
    </DetailHeader>
  )
}

EntityDetailsHeader.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
}

export default EntityDetailsHeader
