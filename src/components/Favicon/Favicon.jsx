import { Helmet } from 'react-helmet'
import { useGetInboxHasUnreadQuery } from '/src/services/inbox/getInbox'

const Favicon = () => {
  const { data: isNewMessages } = useGetInboxHasUnreadQuery()

  return (
    <Helmet defer={false}>
      <title>Ayon {isNewMessages ? ' - Unread Message...' : ''}</title>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`/apple-touch-icon${isNewMessages ? '-new' : ''}.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`/favicon-32x32${isNewMessages ? '-new' : ''}.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`/favicon-16x16${isNewMessages ? '-new' : ''}.png`}
      />
      <link rel="manifest" href={`/site${isNewMessages ? '-new' : ''}.webmanifest`} />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00d7a0" />
      <meta name="msapplication-TileColor" content="#00aba9" />
    </Helmet>
  )
}

export default Favicon
