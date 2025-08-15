import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

const ExplorerPage = () => {
  
  /*
    Render the GraphiQL interface.
    */
  return (
    <>
      <DocumentTitle title="GraphQL Explorer • AYON" />
      <main>
        <iframe className="embed" title="graphiql" src="/graphiql" style={{ flexGrow: 1 }} />
      </main>
    </>
  )
}

export default ExplorerPage
