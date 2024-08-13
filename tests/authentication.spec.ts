import { authenticationTest as test} from './fixtures/authenticationPage'

test.use({ storageState: { cookies: [], origins: [] } })

test('login/logout user', async ({authenticationPage, browserName}) => {
  await authenticationPage.login(process.env.NAME!, process.env.PASSWORD!)
  await authenticationPage.logout()
})