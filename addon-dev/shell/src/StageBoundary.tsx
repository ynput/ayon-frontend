// A crash of the shell's own parts (not of a contribution: those have AYON's boundary) shows
// here and is reported to `ayon-addon open`, instead of blanking the page.
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { setStage } from './status'

export class StageBoundary extends Component<
  { children: ReactNode; what?: string },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const what = this.props.what || 'stage'
    console.error(`[ayon-addon shell] the ${what} crashed`, error, info.componentStack)
    if (what === 'stage') setStage({ ready: false })
  }

  render() {
    if (!this.state.error) return this.props.children
    const what = this.props.what || 'stage'
    const message = (
      <div role="alert" className="ayon-addon-error ayon-shell-crash" style={{ margin: 16 }}>
        The dev shell&apos;s {what} crashed: {this.state.error.message}
      </div>
    )
    return what === 'stage' ? <main className="ayon-shell-stage">{message}</main> : <aside>{message}</aside>
  }
}
