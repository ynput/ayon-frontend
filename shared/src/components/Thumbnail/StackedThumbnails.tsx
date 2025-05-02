import React, { useContext } from 'react'
import styled, { css } from 'styled-components'
import { Thumbnail } from './Thumbnail'
import clsx from 'clsx'
import { ThumbnailUploadContext } from '@shared/context'
import { ThumbnailProps } from '@shared/components'

type StackedStyledProps = {
  $length: number
}

const StackedStyled = styled.div<StackedStyledProps>`
  display: flex;
  z-index: 10;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  min-width: min-content;
  cursor: pointer;

  &.stacking {
    & > * {
      margin: unset;
      aspect-ratio: 1;
      border: solid 2px var(--md-sys-color-outline-variant);
      border-radius: 8px;

      span {
        font-size: 24px;
      }

      ${({ $length }) =>
        $length > 1 &&
        css`
          :not(:last-child) {
            box-shadow: 0 0 4px 0px black;
          }
        `}
    }

    /* create stacked effect */
    & > * + * {
      margin-left: ${({ $length }) => `${Math.max(-20, -$length * 1.5 - 8)}px`};
    }
  }
`

export interface StackedThumbnailsProps
  extends Omit<ThumbnailProps, 'entityType' | 'entityId' | 'projectName'> {
  thumbnails?: any[]
  isLoading?: boolean
  projectName?: string
  className?: string
  style?: React.CSSProperties
}

export const StackedThumbnails = ({
  thumbnails = [],
  isLoading,
  projectName,
  className,
  style,
  ...props
}: StackedThumbnailsProps) => {
  const { onContextMenu } = useContext(ThumbnailUploadContext)
  // limit to 5 users
  thumbnails = thumbnails.slice(0, 5)
  const isStacking = thumbnails.length > 1

  if (!thumbnails.length || !projectName) return null

  return (
    <StackedStyled
      $length={thumbnails.length}
      className={clsx('stacked-thumbnails', className, { stacking: isStacking })}
    >
      {thumbnails.map((thumb, i) =>
        thumb ? (
          <Thumbnail
            projectName={thumb.projectName || projectName}
            entityType={thumb.type}
            entityId={thumb.id}
            icon={thumb.icon}
            key={thumb.id || thumb.src || i}
            style={{ ...style, zIndex: -i }}
            entityUpdatedAt={thumb.updatedAt}
            isLoading={isLoading}
            src={thumb.src}
            // @ts-ignore
            onContextMenu={onContextMenu}
            {...props}
          />
        ) : null,
      )}
    </StackedStyled>
  )
}
