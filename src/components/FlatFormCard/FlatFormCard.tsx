import { ReactNode } from 'react'

export type FlatFormCardProps = {
  title: ReactNode
  /** a button at the end of the title line, such as save */
  action?: ReactNode
  /** the card's panel: what follows the title (see src/styles/flatForm.scss) */
  children: ReactNode
}

/**
 * A titled card of the flat settings layout, placed in a `.flat-form`.
 * flatForm.scss styles what follows the title as the card's panel.
 */
export const FlatFormCard = ({ title, action, children }: FlatFormCardProps) => (
  <section>
    {action ? (
      // flatForm.scss styles the span as the title text and pushes the action to the end
      <header className="flat-form-title">
        <span>{title}</span>
        {action}
      </header>
    ) : (
      <h3 className="flat-form-title">{title}</h3>
    )}
    {children}
  </section>
)

export default FlatFormCard
