import { getUserDetails } from './XUIOAuth2Strategy.class'
import mockAxios from 'jest-mock-axios'

/*test('getUserDetails() should return a promise', () => {
    const jwt = 'jwtString'
    const logoutUrl = 'http://logout.url'

    expect(getUserDetails(jwt, logoutUrl)).toBeInstanceOf(Promise)
})*/

test('getUserDetails() should call http.get', () => {
    const jwt = 'jwtString'
    const logoutUrl = 'http://logout.url'
    const httpGetOptions = {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    }

    getUserDetails(jwt, logoutUrl)

    expect(mockAxios.get).toHaveBeenCalledWith(`${logoutUrl}/details`, httpGetOptions)
})
