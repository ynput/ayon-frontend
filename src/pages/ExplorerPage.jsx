import useTitle from '@hooks/useTitle'

const ExplorerPage = () => {
  useTitle({ page: 'Explorer', project: '' })
  
  /*
    Render the GraphiQL interface.
    */
  return (
    <main>
      <iframe className="embed" title="graphiql" src="/graphiql" style={{ flexGrow: 1 }} />
    </main>
  )
}

export default ExplorerPage
