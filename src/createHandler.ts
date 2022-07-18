import axios, { AxiosRequestConfig } from 'axios'
import { NextApiHandler } from 'next';
import { QueryClient, QueryFunctionContext, useMutation, UseMutationOptions, useQuery, useQueryClient } from 'react-query'
import { failure_http_codes, success_http_codes } from './http-codes';
import { Method, PrefetchFn, queryObjectHookFn, useMutationFn, ApiMethods, MethodNextHandlerBase, getParam, getType, METHODS, HookFnReturnExt, useMutationOpts, getError, successFn, failFn, DefaultError, queryHookOpts, IfHasMethod, AxiosExt, IfHas, getRoutes } from './types'
import { capitalize, catchHandler, httpCode, isServer, parseUrl, queryUrl } from './utils';


type RequestConfig<T> = AxiosRequestConfig<T> & { query?: T } & AxiosExt

type Fetch<P, T> = (params: P, config?: RequestConfig<P>) => Promise<T>
type FetchFromBase<Base extends MethodNextHandlerBase, Method extends METHODS> =
  Fetch<getParam<Base[Method]>, getType<Base[Method]>>

type useMutationType<Base extends MethodNextHandlerBase, Method extends METHODS> =
  useMutationFn<getType<Base[Method]>, getParam<Base[Method]>, getError<Base[Method]>>

type methodsCallerExt<H extends ApiMethods<any>> = {}
  & IfHasMethod<H, 'GET', { get: FetchFromBase<H, "GET"> }>
  & IfHasMethod<H, 'PUT', { put: FetchFromBase<H, "PUT"> }>
  & IfHasMethod<H, 'POST', { post: FetchFromBase<H, "POST"> }>
  & IfHasMethod<H, 'DELETE', { delete: FetchFromBase<H, "DELETE"> }>

type hooksCallerExt<H extends ApiMethods<any>> = {}
  & IfHasMethod<H, 'GET', {
    useGet: queryObjectHookFn<getType<H['GET']>, getParam<H['GET']>>,
    prefetch: PrefetchFn<getParam<H['GET']>>
  }>
  & IfHasMethod<H, 'PUT', { usePut: useMutationType<H, "PUT">, }>
  & IfHasMethod<H, 'POST', { usePost: useMutationType<H, "POST">, }>
  & IfHasMethod<H, 'DELETE', { useDelete: useMutationType<H, "DELETE">, }>

type routesExt<H extends ApiMethods<any>> = 
  IfHas<H, 'routes', { routes: getRoutes<H> }, { routes: {} }>

export type creatorReturn<K extends string = string, H extends ApiMethods<any> = {}> = {
  url: string
  key: K
  handler: NextApiHandler
} & hooksCallerExt<H>
  & methodsCallerExt<H>
  & routesExt<H>['routes']


const endpoint: <
  key extends string,
  Bundler extends ApiMethods<any>,
  // Handler extends NextMethodsHandler<any> = Omit<Bundler, 'routes'>,
  >(
  handlers: Bundler & { key: key },
  url?: string,
) => creatorReturn<key, Bundler>

  = (payload, _url = "/") => {

    const { key, routes, ..._handler } = payload
    const url = parseUrl(_url)

    const res: any = {
      url, key,
    }

    type method<P = any, T = any> = (query: P, config: RequestConfig<P>) => Promise<T>

    const get: method = async (_query, config = {}) => {
      const query = Object.assign({}, config.query, _query)
      const client = config.axios || axios
      return await client.get(queryUrl({ url, query }), config)
        .then(res => res.data)
        .catch(catchHandler)
    }
    res['get'] = get

    const put: method = async (data, config = {}) => {
      const query = Object.assign({}, config.query)
      const client = config.axios || axios
      return await client.put(queryUrl({ url, query }), data, config)
        .then(res => res.data)
        .catch(catchHandler)
    }
    res['put'] = put

    const post: method = async (data, config = {}) => {
      const query = Object.assign({}, config.query)
      const client = config.axios || axios
      return await client.post(queryUrl({ url, query }), data, config)
        .then(res => res.data)
        .catch(catchHandler)
    }
    res['post'] = post

    const m_delete: method = async (data, config = {}) => {
      const query = Object.assign({}, config.query)
      const client = config.axios || axios
      return await client.delete(queryUrl({ url, query }), { data, ...config })
        .then(res => res.data)
        .catch(catchHandler)
    }

    res['delete'] = m_delete

    type ParamsType = any
    type TQueryKey = [string, ParamsType]
    type TData = any
    type Opts = queryHookOpts<TData, ParamsType>

    if ('GET' in _handler) {

      const createQueryHandler = (added_config: AxiosRequestConfig<any> & AxiosExt = {}) => {
        const config = Object.assign(added_config)
        return async ({ queryKey: [_key, query] }: QueryFunctionContext<TQueryKey>) => {
          return await get(query, config)
        }
      }

      const _useQuery: queryObjectHookFn<TData, ParamsType> = (params: ParamsType, _opts: Opts) => {
        const { config, axios, ...opts } = _opts
        const res = useQuery<TData, Error, TData, TQueryKey>([key, params], createQueryHandler({ ...config, axios }), opts)
        const queryClient = useQueryClient()

        const ext: HookFnReturnExt = {
          invalidate: () => queryClient.invalidateQueries(key)
        }

        return { ...ext, ...res }
      }

      const prefetch: PrefetchFn<any> = (params, config = {}) => {
        return async (queryClient: QueryClient) =>
          await queryClient.prefetchQuery([key, params], createQueryHandler(config))
      }

      res['useGet'] = _useQuery
      res['prefetch'] = prefetch
    }

    const _useMutation = (methodFn: any) => (opts: useMutationOpts<any, any, any>) => {
      const queryClient = useQueryClient()

      const onSuccess: UseMutationOptions<any>['onSuccess'] = ((data, vars, cxt) => {
        if (opts.invalidate){
          opts.invalidate.forEach( query => {
            if ( "key" in query )
              queryClient.invalidateQueries( query.key )
            if ( "invalidate" in query )
              query.invalidate() 
          })
        }

        if (opts.onSuccess)
          opts.onSuccess(data, vars, cxt)
      })
      const methodHandler = (data: any) => methodFn(data, { ...opts.config, axios: opts.axios })
      const res = useMutation(methodHandler, {
        ...opts,
        onSuccess,
      })
      return [res.mutateAsync, res]
    }

    if ('POST' in _handler) res['usePost'] = _useMutation(post)
    if ('PUT' in _handler) res['usePut'] = _useMutation(put)
    if ('DELETE' in _handler) res['useDelete'] = _useMutation(m_delete)


    const handler: NextApiHandler = (req, res) => {
      // console.log("Method", req.method, "called to", req.url)
      const fn = _handler[String(req.method).toUpperCase()] as Method<any, any, any>

      if (!fn) {
        return res.status(405).send({
          message: 'method not allowed lmao'
        })
      }
      const success: successFn<any> = (statusCode, data) => res.status(httpCode(statusCode)).json(data)

      const fail: failFn<any> = (statusCode, err) => {
        if (typeof err == 'string') {
          const default_error: DefaultError = {
            message: err
          }
          return res.status(httpCode(statusCode)).json(default_error)
        }
        return res.status(httpCode(statusCode)).json(err)

      }

      res['success'] = success
      res['fail'] = success

      for (let CODE in success_http_codes)
        res[CODE] = (data: any) => success(success_http_codes[CODE], data)
      for (let CODE in failure_http_codes)
        res[CODE] = (err: any) => fail(failure_http_codes[CODE], err)

      return fn({
        body: req.body,
        query: req.query,
        req, success, fail,
        res: res as any
      })
    }
    if( isServer )
      res['handler'] = handler

    if (routes && routes.length > 0) {
      ( routes as creatorReturn<any>[] ).forEach( r => {
        const key = capitalize(r.key)
        res[key] = r
      })
    }

    // console.log(res)
    return res
  }

export { endpoint }
