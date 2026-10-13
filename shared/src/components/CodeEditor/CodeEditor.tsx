import { forwardRef, lazy, Suspense } from 'react'
import type { TextareaCodeEditorProps } from '@uiw/react-textarea-code-editor'

// @uiw/react-textarea-code-editor bundles syntax highlighting for every refractor language
// (~1 MB), so it is loaded on first use instead of with the main bundle
const TextareaCodeEditor = lazy(() => import('@uiw/react-textarea-code-editor'))

export type CodeEditorProps = TextareaCodeEditorProps

/** Drop in replacement for @uiw/react-textarea-code-editor that loads it on demand */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>((props, ref) => {
  // the fallback is a plain read only textarea, so drop the editor only props
  const { language, minHeight, padding, prefixCls, rehypePlugins, onChange, value, ...rest } = props
  return (
    <Suspense
      fallback={
        <textarea
          {...rest}
          ref={ref}
          value={value ?? ''}
          readOnly
          style={{
            padding,
            minHeight,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            ...props.style,
          }}
        />
      }
    >
      <TextareaCodeEditor ref={ref} {...props} />
    </Suspense>
  )
})

CodeEditor.displayName = 'CodeEditor'
