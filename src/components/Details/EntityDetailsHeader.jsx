import React from 'react'
import PropTypes from 'prop-types'
import DetailHeader from '../DetailHeader'
import StackedThumbnails from '/src/pages/editor/StackedThumbnails'
import NameField from '/src/pages/editor/fields/NameField'
import { useSelector } from 'react-redux'
import OverflowField from '../OverflowField'
import styled from 'styled-components'

const ToolsStyled = styled.div`
  display: flex;
  gap: 4px;
  justify-content: end;

  flex: 1;
  margin-right: 1px;
`

const EntityDetailsHeader = ({ values = [], tools }) => {
  const { folders, tasks, families } = useSelector((state) => state.project)
  const changes = useSelector((state) => state.editor.changes)
  const breadcrumbs = useSelector((state) => state.context.breadcrumbs) || {}

  if (!values.length) return null

  const isMultiple = values.length > 1

  let subTitle = ''
  if (isMultiple) {
    subTitle = values.map((v) => v?.name).join(', ')
  } else {
    subTitle = `/ ${breadcrumbs.parents?.join(' / ')} ${breadcrumbs.parents?.length ? ' / ' : ''} ${
      breadcrumbs.folder
    }`

    if (values[0]?.__entityType === 'task') {
      // add on task at end
      subTitle += ' / '
      subTitle += values[0].name
    }

    if (values[0]?.__entityType === 'version' || values[0]?.__entityType === 'representation') {
      // add on family at end
      subTitle += ' / '
      subTitle += breadcrumbs.subset
      subTitle += ' / '
      subTitle += breadcrumbs.version
    }

    // subset
    if (values[0]?.__entityType === 'subset') {
      // add on family at end
      subTitle += ' / '
      subTitle += breadcrumbs.subset
    }
  }

  const thumbnails = values.map((node) =>
    node ? { id: node.id, type: node.__entityType, updatedAt: node.updatedAt } : {},
  )

  return (
    <DetailHeader>
      <StackedThumbnails thumbnails={thumbnails} />
      <div style={{ overflowX: 'clip', paddingLeft: 3, marginLeft: -3 }}>
        {!isMultiple ? (
          <NameField
            node={values[0]}
            changes={changes}
            styled
            tasks={tasks}
            folders={folders}
            families={families}
            style={{ display: 'flex', gap: 4 }}
            iconStyle={{ fontSize: 19, marginRight: 0 }}
          />
        ) : (
          <h2>Multiple Selected ({values.length})</h2>
        )}
        <OverflowField value={subTitle} style={{ left: -3 }} align="left" />
      </div>
      {tools && <ToolsStyled>{tools}</ToolsStyled>}
    </DetailHeader>
  )
}

EntityDetailsHeader.propTypes = {
  values: PropTypes.arrayOf(PropTypes.object),
}

export default EntityDetailsHeader
