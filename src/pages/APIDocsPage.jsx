import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

const APIDocsPage = () => {
  
  return (
    <>
      <DocumentTitle title="API Docs • AYON" />
      <main>
      <iframe className="embed" title="apidoc" src="/docs" style={{ flexGrow: 1 }} />
    </main>
    </>
  )
}

export default APIDocsPage
