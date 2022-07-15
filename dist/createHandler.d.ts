import { AxiosRequestConfig } from 'axios';
import { NextApiHandler } from 'next';
import { PrefetchFn, queryObjectHookFn, useMutationFn, NextMethodsHandler, MethodNextHandlerBase, getParam, getType, METHODS, getError, IfHasMethod, AxiosExt, IfHas, getRoutes } from './types';
declare type RequestConfig<T> = AxiosRequestConfig<T> & {
    query?: T;
} & AxiosExt;
declare type Fetch<P, T> = (params: P, config?: RequestConfig<P>) => Promise<T>;
declare type FetchFromBase<Base extends MethodNextHandlerBase, Method extends METHODS> = Fetch<getParam<Base[Method]>, getType<Base[Method]>>;
declare type useMutationType<Base extends MethodNextHandlerBase, Method extends METHODS> = useMutationFn<getType<Base[Method]>, getParam<Base[Method]>, getError<Base[Method]>>;
declare type methodsCallerExt<H extends NextMethodsHandler<any>> = {} & IfHasMethod<H, 'GET', {
    get: FetchFromBase<H, "GET">;
}> & IfHasMethod<H, 'PUT', {
    put: FetchFromBase<H, "PUT">;
}> & IfHasMethod<H, 'POST', {
    post: FetchFromBase<H, "POST">;
}> & IfHasMethod<H, 'DELETE', {
    delete: FetchFromBase<H, "DELETE">;
}>;
declare type hooksCallerExt<H extends NextMethodsHandler<any>> = {} & IfHasMethod<H, 'GET', {
    useGet: queryObjectHookFn<getType<H['GET']>, getParam<H['GET']>>;
    prefetch: PrefetchFn<getParam<H['GET']>>;
}> & IfHasMethod<H, 'PUT', {
    usePut: useMutationType<H, "PUT">;
}> & IfHasMethod<H, 'POST', {
    usePost: useMutationType<H, "POST">;
}> & IfHasMethod<H, 'DELETE', {
    useDelete: useMutationType<H, "DELETE">;
}>;
declare type routesExt<H extends NextMethodsHandler<any>> = IfHas<H, 'routes', {
    routes: getRoutes<H>;
}, {
    routes: {};
}>;
export declare type creatorReturn<K extends string = string, H extends NextMethodsHandler<any> = {}> = {
    url: string;
    key: K;
    handler: NextApiHandler;
} & hooksCallerExt<H> & methodsCallerExt<H> & routesExt<H>['routes'];
declare const createHandler: <key extends string, Bundler extends NextMethodsHandler<any>>(handlers: Bundler & {
    key: key;
}, url?: string) => creatorReturn<key, Bundler>;
export { createHandler };
