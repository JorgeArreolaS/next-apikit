import { AxiosError } from "axios";
import { HTTP_CODES } from "./types";
export declare const httpCode: (nameOrCode: HTTP_CODES | number) => number;
export declare const isServer: boolean;
export declare const parseUrl: (url: string) => string;
export declare const queryUrl: ({ url, query }: {
    url: string;
    query: any;
}) => string;
export declare const catchHandler: <T = any>(err: AxiosError<T, any>) => never;
export declare const capitalize: (str: string) => string;
