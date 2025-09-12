import clsx from 'clsx'
import { FC } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  padding: var(--padding-l);
  border-radius: var(--border-radius-xxl);
  border: 1px solid var(--md-sys-color-outline-variant);

  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  h3 {
    margin: 0;
    padding: 4px 0;
  }
`

const Row = styled.div`
  display: flex;

  .label {
    width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--md-sys-color-outline);
    display: block;
  }

  .value {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

interface DetailsMetaDataProps {
  data: Record<string, any>
  title?: string
  isLoading?: boolean
}

export const DetailsMetaData: FC<DetailsMetaDataProps> = ({ data, title, isLoading }) => {
  return (
    <Container>
      {title && <h3>{title}</h3>}
      {Object.entries(data).map(([key, value]) => (
        <Row key={key} className={clsx({ loading: isLoading })}>
          <label className="label">{key}</label>
          <span className={'value'}>{String(value)}</span>
        </Row>
      ))}
    </Container>
  )
}
