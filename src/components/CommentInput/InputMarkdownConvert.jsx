import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// transform url to mention (if it is a mention)
const urlToMention = (href, options) => {
  if (!href) return { href }
  // check href is a mention
  const type = href && href.split(':')[0]
  // find the type in mention options
  const typeSymbol = Object.entries(options).find(([, value]) => value.id === type)?.[0]
  if (!typeSymbol) return { href }
  // prefix @ to the href
  const newHref = '@' + href
  return { href: newHref, type: typeSymbol }
}

const InputMarkdownConvert = ({ typeOptions, initValue }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => url}
      components={{
        a: ({ children, href }) => {
          const { href: newHref, type } = urlToMention(href, typeOptions)

          return (
            <a href={newHref}>
              {type}
              {children}
            </a>
          )
        },
        // transform ul checklist into multiple uls
        ul: (props) => {
          if (!props.className?.includes('contains-task-list')) return <ul {...props} />

          // split each li item into its own ul
          const items = props.node?.children?.filter((item) => item.tagName === 'li')
          const elements = props?.children?.filter((item) => item.type === 'li')
          const uls = items.map((liItem, index) => {
            const element = elements[index]

            let checked = false
            // get checked prop
            liItem.children
              .filter((item) => item.type === 'element')
              .forEach((el) =>
                el?.children?.forEach((child) => {
                  if (child.tagName === 'input') {
                    checked = child.properties.checked
                  }
                }),
              )
            return (
              <ul key={index} data-checked={checked}>
                <li>{element}</li>
              </ul>
            )
          })
          return uls
        },
      }}
    >
      {initValue}
    </ReactMarkdown>
  )
}

export default InputMarkdownConvert
