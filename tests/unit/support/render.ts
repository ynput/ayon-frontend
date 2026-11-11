import { createElement, Fragment } from 'react'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Playwright compiles the JSX of the files it loads to its own element objects (for component
// testing). These helpers turn them into React elements, so a component can be rendered here.
const adapted = new WeakMap<Function, ComponentType<any>>()

const adapt = (Component: Function): ComponentType<any> => {
  if (!adapted.has(Component)) {
    const Base = Component as unknown as new (props: object) => { render(): unknown }
    adapted.set(
      Component,
      // class components (error boundaries) render through their own render
      Component.prototype?.isReactComponent
        ? (class extends Base {
            render() {
              return toReact(super.render())
            }
          } as unknown as ComponentType<any>)
        : (props: object) => toReact(Component(props)),
    )
  }
  return adapted.get(Component)!
}

const toReact = (node: any): ReactNode => {
  if (Array.isArray(node)) return node.map(toReact)
  if (node?.__pw_type !== 'jsx') return node
  const { children, ...props } = node.props
  const type =
    typeof node.type === 'function' ? adapt(node.type) : node.type?.__pw_jsx_fragment ? Fragment : node.type
  const childNodes = children === undefined ? [] : [children].flat().map(toReact)
  return createElement(type, { ...props, key: node.key }, ...childNodes)
}

/** A component from the app as React renders it, e.g. to hand to code that isn't compiled here. */
export const toReactComponent = (Component: Function) => adapt(Component)

/** Renders a component from the app to HTML, without a browser. `wrap` adds providers around it. */
export const renderToHtml = (
  Component: Function,
  props: Record<string, unknown> = {},
  wrap: (element: ReactElement) => ReactElement = (element) => element,
) => renderToStaticMarkup(wrap(createElement(adapt(Component), props)))
