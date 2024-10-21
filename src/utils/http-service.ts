import axios, { AxiosResponse } from 'axios';

export class HttpService {
  async get(url: string): Promise<AxiosResponse<any>> {
    return axios.get(url);
  }
}