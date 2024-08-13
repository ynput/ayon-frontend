import { getUserName, userTest as  test} from './fixtures/userPage'

test('create/delete user', async ({userPage, browserName}) => {
  const userName = getUserName('test_user')(browserName)
  await userPage.createUser(userName)
  await userPage.deleteUser(userName)
})