import { forwardRef } from 'react'
import { EntityCard, EntityCardProps } from '@ynput/ayon-react-components'
import { useEntityCardFilmstrip } from './useEntityCardFilmstrip'

export interface FilmstripEntityCardProps extends EntityCardProps {
  /** hover-scrub filmstrip url (see getEntityFilmstripUrl) */
  filmstripUrl?: string | null
}

/** ARC EntityCard with a hover-scrub filmstrip */
export const FilmstripEntityCard = forwardRef<HTMLDivElement, FilmstripEntityCardProps>(
  ({ filmstripUrl, pt, ...props }, ref) => {
    const { thumbnailProps, filmstrip } = useEntityCardFilmstrip(filmstripUrl, {
      disabled: props.isLoading,
    })

    return (
      <>
        <EntityCard
          ref={ref}
          {...props}
          pt={{ ...pt, thumbnail: { ...pt?.thumbnail, ...thumbnailProps } }}
        />
        {filmstrip}
      </>
    )
  },
)

FilmstripEntityCard.displayName = 'FilmstripEntityCard'
