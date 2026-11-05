import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { getPillColors } from '@shared/util/pillColors'
import * as Styled from './StatusLabel.styled'

type StatusForm = 'full' | 'short' | 'icon'

export interface StatusLabelStatus {
  name: string
  shortName?: string
  icon?: string
  color?: string
  colorLight?: string | null
}

export interface StatusLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  // one status, or a change from the first to the last; all of them shrink together
  statuses: StatusLabelStatus[]
  arrowIcon?: string
  arrowClassName?: string
}

// A status where a full pill would be too loud (the feed, the inbox): its icon in a square filled with the
// status colour, like the pill, then the name. With less room it shows the short names, then the icons alone,
// and never gets narrower than that. The full names stay in the tooltip and for screen readers.
export const StatusLabel = ({
  statuses,
  arrowIcon = 'trending_flat',
  arrowClassName,
  className,
  style,
  ...props
}: StatusLabelProps) => {
  const rootRef = useRef<HTMLSpanElement>(null)
  const fullRef = useRef<HTMLSpanElement>(null)
  const shortRef = useRef<HTMLSpanElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)
  const [form, setForm] = useState<StatusForm>('full')
  const [iconWidth, setIconWidth] = useState(0)

  const hasShort = statuses.some((s) => s.shortName && s.shortName !== s.name)
  const names = statuses.map((s) => s.name).join(' to ')
  const key = statuses.map((s) => `${s.name}|${s.shortName}|${s.icon}`).join(',')

  // the full form stays laid out (hidden), so the label keeps asking for its full width and grows back;
  // each form is measured from a copy outside the layout, since the laid out one shrinks with the label
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    setIconWidth(iconRef.current?.offsetWidth ?? 0)
    const fit = () => {
      const room = root.clientWidth
      const full = fullRef.current?.offsetWidth ?? 0
      const short = shortRef.current?.offsetWidth ?? 0
      setForm(room >= full ? 'full' : hasShort && room >= short ? 'short' : 'icon')
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(root)
    return () => observer.disconnect()
  }, [key, hasShort])

  const render = (as: StatusForm) =>
    statuses.map((status, index) => (
      <Fragment key={index}>
        {index > 0 && <Icon icon={arrowIcon} className={clsx('arrow', arrowClassName)} />}
        <span className="status">
          <Styled.Square
            style={
              status.color ? getPillColors({ ...status, color: status.color }, 'filled') : undefined
            }
          >
            <Icon icon={status.icon || 'fiber_manual_record'} />
          </Styled.Square>
          {as !== 'icon' && (
            <span className="label">
              {as === 'full' ? status.name : status.shortName || status.name}
            </span>
          )}
        </span>
      </Fragment>
    ))

  return (
    <Styled.Status
      ref={rootRef}
      {...props}
      className={clsx(form, className)}
      style={{ minWidth: iconWidth, ...style }}
      data-tooltip={form === 'full' ? undefined : names}
    >
      <Styled.Form className="sizer" aria-hidden>
        {render('full')}
      </Styled.Form>
      <Styled.Form ref={fullRef} className="measure" aria-hidden>
        {render('full')}
      </Styled.Form>
      {hasShort && (
        <Styled.Form ref={shortRef} className="measure" aria-hidden>
          {render('short')}
        </Styled.Form>
      )}
      <Styled.Form ref={iconRef} className="measure" aria-hidden>
        {render('icon')}
      </Styled.Form>
      <Styled.Form className="shown" aria-hidden>
        {render(form)}
      </Styled.Form>
      <Styled.ScreenReaderText>{names}</Styled.ScreenReaderText>
    </Styled.Status>
  )
}
