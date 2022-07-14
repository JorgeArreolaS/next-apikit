import axios, { Axios, AxiosError, AxiosRequestConfig } from 'axios'
import { NextApiHandler, NextApiResponse } from 'next';
import { QueryClient, QueryFunctionContext, useMutation, UseMutationOptions, UseMutationResult, useQuery, useQueryClient, UseQueryOptions } from 'react-query'
import { queryHookFn, NextMethod, PrefetchFn, useQueryFnType, queryObjectHookFn, useMutationFn, NextMethodsHandler, MethodNextHandlerBase, getParam, getType, METHODS, HookFnReturnExt, queryHookReturnType, useMutationOptsExt, useMutationOpts, getError, successFn, failFn, DefaultError, queryHookOpts, IfHasMethod } from './types'

let isServer = (typeof window === 'undefined') ? true : false;

const parseUrl = ({ url, query }: { url: string, query: any }) => {

  if (isServer && !url.includes("http"))
    url = `http://localhost:${process.env.PORT || 3000}` + url

  if (url.endsWith('index'))
    url = url.replace(/\/index$/, "")

  // If the "query" is just a string, number or boolean
  // transform it to ?value=query
  if (['string', 'number', 'boolean'].includes(typeof query))
    query = { value: query }
  let params = new URLSearchParams(query).toString()

  if (params) return url + '?' + params

  return url
}

const catchHandler = <T = any>(err: AxiosError<T>) => {
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

type RequestConfig<T> = AxiosRequestConfig<T> & { query?: T }

type Fetch<P, T> = (params: P, config?: RequestConfig<P>) => Promise<T>
type FetchFromBase<Base extends MethodNextHandlerBase, Method extends METHODS> =
  Fetch<getParam<Base[Method]>, getType<Base[Method]>>

type useMutationType<Base extends MethodNextHandlerBase, Method extends METHODS> =
  useMutationFn<getType<Base[Method]>, getParam<Base[Method]>, getError<Base[Method]>>

type methodsCallerExt< H extends NextMethodsHandler<any> > = {}
  & IfHasMethod<H, 'GET', { get: FetchFromBase<H, "GET"> }>
  & IfHasMethod<H, 'PUT', { put: FetchFromBase<H, "PUT"> }>
  & IfHasMethod<H, 'POST', { post: FetchFromBase<H, "POST"> }>
  & IfHasMethod<H, 'DELETE', { delete: FetchFromBase<H, "DELETE"> }>

type hooksCallerExt< H extends NextMethodsHandler<any> > = {}
  & IfHasMethod<H, 'GET',  { 
    useGet: queryObjectHookFn<getType<H['GET']>, getParam<H['GET']>>,
    prefetch: PrefetchFn<getParam<H['GET']>>
  }>
  & IfHasMethod<H, 'PUT',  { usePut: useMutationType<H, "PUT">, }>
  & IfHasMethod<H, 'POST',  { usePost: useMutationType<H, "POST">, }>
  & IfHasMethod<H, 'DELETE',  { useDelete: useMutationType<H, "DELETE">, }>

const createHandler: <
  Handler extends NextMethodsHandler<any> = NextMethodsHandler<{}>
> (
  handlers: Handler,
  url?: string,
) => {
  handler: NextApiHandler,
  url: string,

  buildReactQuery: (key: string, config?: RequestConfig<getParam<Handler['GET']>>) => {
    url: string,
    key: string,
  } & hooksCallerExt<Handler>

} & methodsCallerExt<Handler>
  = (_handler, url = "/") => {

    type method<P = any, T = any> = (query: P, config: RequestConfig<P>) => Promise<T>

    const get: method = async (_query, config = {}) => {
      const query = Object.assign({}, config.query, _query)
      return await axios.get(parseUrl({ url, query }), config)
        .then(res => res.data)
        .catch(catchHandler)
    }

    const put: method = async (data, config = {}) => {
      const query = Object.assign({}, config.query)
      return await axios.put(parseUrl({ url, query }), data, config)
        .then(res => res.data)
        .catch(catchHandler)
    }

    const post: method = async (data, config = {}) => {
      const query = Object.assign({}, config.query)
      return await axios.post(parseUrl({ url, query }), data, config)
        .then(res => res.data)
        .catch(catchHandler)
    }

    const m_delete: method = async (data, config = {}) => {
      const query = Object.assign({}, config.query)
      return await axios.delete(parseUrl({ url, query }), { data, ...config })
        .then(res => res.data)
        .catch(catchHandler)
    }

    const buildReactQuery: (key: string, config: RequestConfig<any>) => any = 
    (key, general_config = {}) => {

      type ParamsType = any
      type TQueryKey = [string, ParamsType]

      const createQueryHandler = ( added_config: AxiosRequestConfig<any> = {} ) => {
        const config = Object.assign( general_config, added_config )
        return async ( { queryKey: [_key, query] }: QueryFunctionContext<TQueryKey> ) => {
          return await get(query, config)
        }
      }

      type TData = any
      type Opts = queryHookOpts<TData, ParamsType>

      const query: queryHookFn<TData, ParamsType> = (params: ParamsType, _opts: Opts) => {
        const { config, ...opts } = _opts
        const res = useQuery<TData, Error, TData, TQueryKey>([key, params], createQueryHandler(config), opts)
        const queryClient = useQueryClient()

        const ext: HookFnReturnExt = {
          invalidate: () => queryClient.invalidateQueries(key)
        }

        return [res.data, { ...ext, ...res }]

      }
      const queryObject: queryObjectHookFn<TData, ParamsType> = (params: ParamsType, _opts: Opts) => {
        const { config, ...opts } = _opts
        const res = useQuery<TData, Error, TData, TQueryKey>([key, params], createQueryHandler(config), opts)
        const queryClient = useQueryClient()

        const ext: HookFnReturnExt = {
          invalidate: () => queryClient.invalidateQueries(key)
        }

        return { ...ext, ...res }
      }

      const _useMutation = (methodFn: any) => (opts: useMutationOpts<any, any, any>) => {
        const onSuccess = ((data, vars, cxt) => {
          if (opts.invalidate)
            opts.invalidate.forEach(query => query.invalidate())

          if (opts.onSuccess)
            opts.onSuccess(data, vars, cxt)
        })
        const methodHandler = (data: any) => methodFn(data, opts.config)
        const res = useMutation(methodHandler, {
          ...opts,
          onSuccess,
        })
        return [res.mutate, res]
      }

      const prefetch: PrefetchFn<any> = (params, config = {}) =>
        async (queryClient: QueryClient) =>
          await queryClient.prefetchQuery([key, params], createQueryHandler(config) )

      return {
        key,
        url,

        useGet: queryObject,
        usePost: _useMutation(post),
        usePut: _useMutation(put),
        useDelete: _useMutation(m_delete),

        prefetch,
      }

    }

    const handler: NextApiHandler = (req, res) => {
      // console.log("Method", req.method, "called to", req.url)
      const fn = _handler[String(req.method).toUpperCase()] as NextMethod<any, any, any>

      if (!fn) {
        return res.status(405).send({
          message: 'method not allowed lmao'
        })
      }
      const success: successFn<any> = (statusCode, data) => res.status(statusCode).json(data)

      const fail: failFn<any> = (statusCode, err) => {
        if (typeof err == 'string') {
          const default_error: DefaultError = {
            message: err
          }
          return res.status(statusCode).json(default_error)
        }
        return res.status(statusCode).json(err)

      }

      res['success'] = success
      res['fail'] = success

      return fn({
        body: req.body,
        query: req.query,
        req, success, fail,
        res: res as any
      })
    }

    return {
      handler,
      url,
      get, post, put, delete: m_delete,
      buildReactQuery
    }
  }

export { createHandler }
