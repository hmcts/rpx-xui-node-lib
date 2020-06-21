import { getUserDetails } from './XUIOAuth2Strategy.class'
import { http } from '../../../common'

test('getUserDetails() should return a promise', () => {
    jest.spyOn(http, 'get')
    const jwt = 'jwtString'
    const logoutUrl = 'http://logout.url'

    expect(getUserDetails(jwt, logoutUrl)).toBeInstanceOf(Promise)
})

test('getUserDetails() should call http.get', () => {
    const jwt = 'jwtString'
    const logoutUrl = 'http://logout.url'

    const spyOnHttpGet = jest.spyOn(http, 'get')
    const httpGetOptions = {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    }

    getUserDetails(jwt, logoutUrl)

    expect(spyOnHttpGet).toBeCalledWith(`${logoutUrl}/details`, httpGetOptions)
})
