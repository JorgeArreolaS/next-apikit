import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { QueryClient, QueryObserverResult, UseMutateAsyncFunction, UseMutationOptions, UseMutationResult, useQuery, UseQueryOptions } from 'react-query';
import { creatorReturn } from './createHandler';
import { failure_http_codes, http_codes, success_http_codes } from './http-codes';
export declare type DefaultError = {
    message: string;
};
declare type ErrorResponse<E = DefaultError> = E & {
    code: string;
    status: number;
    statusText: string;
};
declare type InvalidateExtensionFn = () => Promise<void>;
export declare type HookFnReturnExt = {
    invalidate: InvalidateExtensionFn;
};
export declare type HookFnOptsExt<P> = {
    config?: AxiosRequestConfig<P>;
} & AxiosExt;
export declare type queryHookReturnType<T> = QueryObserverResult<T | undefined, Error> & HookFnReturnExt;
export declare type queryHookOpts<T, P> = UseQueryOptions<T, Error, T, [string, P]> & HookFnOptsExt<P>;
export declare type queryHookFn<T, P> = (params: P, opts: queryHookOpts<T, P>) => [T, queryHookReturnType<T>];
export declare type queryObjectHookFn<T, P> = (params: P, opts: queryHookOpts<T, P>) => queryHookReturnType<T>;
export declare type useMutationOptsExt<P> = {
    invalidate?: queryHookReturnType<any>[];
    config?: AxiosRequestConfig<P>;
} & AxiosExt;
export declare type useMutationReturnExt = {};
export declare type useMutationOpts<T, Q, E> = UseMutationOptions<T, ErrorResponse<E>, Q> & useMutationOptsExt<Q>;
export declare type useMutationReturn<T, Q, E> = UseMutationResult<T, ErrorResponse<E>, Q> & useMutationReturnExt;
export declare type useMutationFn<T, Q, E = Record<string, any>> = (opts: useMutationOpts<T, Q, E>) => [UseMutateAsyncFunction<T, E, Q>, useMutationReturn<T, Q, E>];
export declare type PrefetchFn<P> = (params: P, config?: AxiosRequestConfig<P>) => (queryClient: QueryClient) => Promise<void>;
export declare type useQueryFnType = typeof useQuery;
export declare type AxiosExt = {
    axios?: AxiosInstance;
};
declare type NextApiParamsRequest<P> = Omit<NextApiRequest, 'query' | 'body'> & {
    query?: P;
    body?: P;
};
declare type PrimitivesMiddleware<T> = T extends string | number | boolean ? {
    value: T;
} : T;
export declare type successFn<T> = (statusCode: number | SUCCESS_HTTP_CODES, data: T) => void;
export declare type failFn<E> = (statusCode: number | FAILURE_HTTP_CODES, data: E extends DefaultError ? string : E) => void;
export declare type successCodeFns<T> = {
    [code in SUCCESS_HTTP_CODES]: (data: T) => void;
};
export declare type failureCodeFns<E> = {
    [code in FAILURE_HTTP_CODES]: (data: E extends DefaultError ? string : E) => void;
};
export declare type Method<T, P = any, E extends Record<string, any> = DefaultError> = (items: {
    query: P;
    body: P;
    req: NextApiParamsRequest<PrimitivesMiddleware<P>>;
    res: NextApiResponse<T> & {
        success: successFn<T>;
        fail: failFn<E>;
    } & successCodeFns<T> & failureCodeFns<E>;
    success: successFn<T>;
    fail: failFn<E>;
}) => void;
export declare type METHODS = 'GET' | 'POST' | 'PUT' | 'DELETE';
export declare type MethodNextHandlerBase = {
    [X in METHODS]?: Method<any, any, any>;
} & HandlerRoutesTypeExt;
export declare type HandlerRoutesTypeExt = {
    routes?: creatorReturn<any>[];
};
declare type getRoutesTypes<l extends creatorReturn[]> = (l extends (infer T)[] ? T : unknown);
export declare type getRoutes<H extends HandlerRoutesTypeExt, R extends creatorReturn[] = H['routes']> = {
    [x in getRoutesTypes<R>['key'] as Capitalize<x>]: Extract<getRoutesTypes<R>, {
        key: x;
    }>;
};
export declare type RoutesBaseExt<H extends HandlerRoutesTypeExt> = {
    routes?: getRoutes<H>;
};
export declare type ApiMethods<Base extends MethodNextHandlerBase> = {
    [X in keyof Base]?: Base[X];
};
export declare type getType<H extends Method<unknown, unknown, unknown>> = H extends Method<infer K, any, any> ? K : any;
export declare type getParam<H extends Method<unknown, unknown, unknown>> = H extends Method<any, infer K, any> ? K : any;
export declare type getError<H extends Method<unknown, unknown, unknown>> = H extends Method<any, any, infer K> ? K : any;
export declare type IfHasMethod<H extends {
    [x: string]: any;
}, M extends METHODS, YES extends any, NO extends any = {}> = Required<H> extends {
    [x in M]: Method<unknown, unknown, unknown>;
} ? YES : NO;
export declare type IfHas<H extends {
    [x: string]: any;
}, M extends string, YES extends any, NO extends any = any> = Required<H> extends {
    [x in M]: any;
} ? YES : NO;
export declare type HTTP_CODES = keyof typeof http_codes;
export declare type SUCCESS_HTTP_CODES = keyof typeof success_http_codes;
export declare type FAILURE_HTTP_CODES = keyof typeof failure_http_codes;
export {};
