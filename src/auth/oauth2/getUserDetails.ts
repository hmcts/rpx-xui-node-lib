import { http } from '../../http/http'
import { AxiosResponse } from 'axios'
export async function getUserDetails(jwt: string, url: string): Promise<AxiosResponse> {
    const options = {
        headers: { Authorization: `Bearer ${jwt}` },
    }
    return await http.get(`${url}/details`, options)
}
