import { http_codes } from "./http-codes";
import { HTTP_CODES } from "./types";

export const httpCode = (nameOrCode: HTTP_CODES | number): number => {
  if( typeof nameOrCode === 'number' )
    return nameOrCode
  return http_codes[nameOrCode]
}
