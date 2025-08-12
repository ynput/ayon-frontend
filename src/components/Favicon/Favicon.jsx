import { Helmet } from 'react-helmet'
import { useGetInboxHasUnreadQuery } from '@queries/inbox/getInbox'
import { useSelector } from 'react-redux'

const Favicon = () => {
  const user = useSelector((state) => state.user)
  const { data: hasUnread } = useGetInboxHasUnreadQuery({}, { skip: !user })
  return (
    <Helmet defer={false}>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`/apple-touch-icon${hasUnread ? '-new' : ''}.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`/favicon-32x32${hasUnread ? '-new' : ''}.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`/favicon-16x16${hasUnread ? '-new' : ''}.png`}
      />
      <link rel="manifest" href={`/site${hasUnread ? '-new' : ''}.webmanifest`} />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#00d7a0" />
      <meta name="msapplication-TileColor" content="#00aba9" />
    </Helmet>
  )
}

export default Favicon
