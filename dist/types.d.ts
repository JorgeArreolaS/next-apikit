import { AxiosRequestConfig } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';
import { QueryClient, QueryObserverResult, UseMutationOptions, UseMutationResult, useQuery, UseQueryOptions } from 'react-query';
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
};
export declare type queryHookReturnType<T> = QueryObserverResult<T | undefined, Error> & HookFnReturnExt;
export declare type queryHookOpts<T, P> = UseQueryOptions<T, Error, T, [string, P]> & HookFnOptsExt<P>;
export declare type queryHookFn<T, P> = (params: P, opts: queryHookOpts<T, P>) => [T, queryHookReturnType<T>];
export declare type queryObjectHookFn<T, P> = (params: P, opts: queryHookOpts<T, P>) => queryHookReturnType<T>;
export declare type useMutationOptsExt<P> = {
    invalidate?: queryHookReturnType<any>[];
    config?: AxiosRequestConfig<P>;
};
export declare type useMutationReturnExt = {};
export declare type useMutationOpts<T, Q, E> = UseMutationOptions<T, ErrorResponse<E>, Q> & useMutationOptsExt<Q>;
export declare type useMutationReturn<T, Q, E> = UseMutationResult<T, ErrorResponse<E>, Q> & useMutationReturnExt;
export declare type useMutationFn<T, Q, E = Record<string, any>> = (opts: useMutationOpts<T, Q, E>) => [useMutationReturn<T, Q, E>['mutate'], useMutationReturn<T, Q, E>];
export declare type PrefetchFn<P> = (params: P, config?: AxiosRequestConfig<P>) => (queryClient: QueryClient) => Promise<void>;
export declare type useQueryFnType = typeof useQuery;
declare type NextApiParamsRequest<P> = Omit<NextApiRequest, 'query' | 'body'> & {
    query?: P;
    body?: P;
};
declare type PrimitivesMiddleware<T> = T extends string | number | boolean ? {
    value: T;
} : T;
export declare type successFn<T> = (statusCode: number, data: T) => void;
export declare type failFn<E> = (statusCode: number, data: E extends DefaultError ? string : E) => void;
export declare type NextMethod<T, P = any, E extends Record<string, any> = DefaultError> = (items: {
    query: P;
    body: P;
    req: NextApiParamsRequest<PrimitivesMiddleware<P>>;
    res: NextApiResponse<T> & {
        success: successFn<T>;
        fail: failFn<E>;
    };
    success: successFn<T>;
    fail: failFn<E>;
}) => void;
export declare type METHODS = 'GET' | 'POST' | 'PUT' | 'DELETE';
export declare type MethodNextHandlerBase = {
    [X in METHODS]?: NextMethod<any> | ((p: any, e?: any) => any);
};
export declare type NextMethodsHandler<Base extends MethodNextHandlerBase> = {
    [X in keyof Base]?: Base[X];
};
export declare type getType<H extends NextMethod<unknown, unknown, unknown>> = H extends NextMethod<infer K, any, any> ? K : any;
export declare type getParam<H extends NextMethod<unknown, unknown, unknown>> = H extends NextMethod<any, infer K, any> ? K : any;
export declare type getError<H extends NextMethod<unknown, unknown, unknown>> = H extends NextMethod<any, any, infer K> ? K : any;
export declare type IfHasMethod<H extends {
    [x: string]: any;
}, M extends METHODS, YES extends any, NO extends any = {}> = Required<H> extends {
    [x in M]: NextMethod<any>;
} ? YES : NO;
export {};
