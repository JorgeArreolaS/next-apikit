import { AxiosError } from "axios";
import { http_codes } from "./http-codes";
import { DefaultError, HTTP_CODES } from "./types";

export const httpCode = (nameOrCode: HTTP_CODES | number): number => {
  if( typeof nameOrCode === 'number' )
    return nameOrCode
  return http_codes[nameOrCode]
}

export const isServer = (typeof window === 'undefined') ? true : false;

export const parseUrl = ( url: string ) => {

  if (isServer && !url.includes("http"))
    url = `http://localhost:${process.env.PORT || 3000}` + url

  if (url.endsWith('index'))
    url = url.replace(/\/index$/, "")

  return url

}

export const queryUrl = ({ url, query }: { url: string, query: any }) => {

  // If the "query" is just a string, number or boolean
  // transform it to ?value=query
  if (['string', 'number', 'boolean'].includes(typeof query))
    query = { value: query }
  let params = new URLSearchParams(query).toString()

  if (params) return url + '?' + params

  return url
}

export const catchHandler = <T = any>(err: AxiosError<T>) => {
  let data: T | DefaultError = err.response.data
  if (typeof data == 'string') {
    const default_error: DefaultError = {
      message: data
    }
    data = default_error
  }
  throw {
    code: err.code,
    status: err.response.status,
    statusText: err.response.statusText,
    ...data,
  }
}

export const capitalize = (str: string) => {
  return str[0].toUpperCase() + str.slice(1)
}
