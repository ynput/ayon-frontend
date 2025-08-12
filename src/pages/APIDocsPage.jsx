import useTitle from '@hooks/useTitle'

const APIDocsPage = () => {
  useTitle({ page: 'API Docs', project: '' })
  
  return (
    <main>
      <iframe className="embed" title="apidoc" src="/docs" style={{ flexGrow: 1 }} />
    </main>
  )
}

export default APIDocsPage
