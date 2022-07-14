import { AxiosRequestConfig } from 'axios';
import { NextApiRequest, NextApiResponse } from 'next'
import { QueryClient, QueryObserverResult, UseMutationOptions, UseMutationResult, useQuery, UseQueryOptions } from 'react-query'

// Utils

export type DefaultError = { message: string }

type ErrorResponse<E = DefaultError> = E & {
  code: string
  status: number
  statusText: string
};


// Queries section

type InvalidateExtensionFn = () => Promise<void>
export type HookFnReturnExt = {
  invalidate: InvalidateExtensionFn
}
export type HookFnOptsExt<P> = {
  config?: AxiosRequestConfig<P>
}
export type queryHookReturnType<T> = QueryObserverResult<T | undefined, Error> & HookFnReturnExt
export type queryHookOpts<T, P> = UseQueryOptions<T, Error, T, [string, P]> & HookFnOptsExt<P>

export type queryHookFn<T, P> = (params: P, opts: queryHookOpts<T, P>) => [T, queryHookReturnType<T>]
export type queryObjectHookFn<T, P> = (params: P, opts: queryHookOpts<T, P>) => queryHookReturnType<T>


// Mutations section

export type useMutationOptsExt<P> = {
  invalidate?: queryHookReturnType<any>[]
  config?: AxiosRequestConfig<P>
}
export type useMutationReturnExt = {

}
export type useMutationOpts<T, Q, E> = UseMutationOptions<T, ErrorResponse<E>, Q> & useMutationOptsExt<Q>
export type useMutationReturn<T, Q, E> = UseMutationResult<T, ErrorResponse<E>, Q> & useMutationReturnExt

export type useMutationFn<T, Q, E = Record<string, any>> = (
  opts: useMutationOpts<T, Q, E>
) => [useMutationReturn<T, Q, E>['mutate'], useMutationReturn<T, Q, E>]


// Misc section

export type PrefetchFn<P> = (params: P, config?: AxiosRequestConfig<P>) => (queryClient: QueryClient) => Promise<void>
export type useQueryFnType = typeof useQuery


// API handlers

type NextApiParamsRequest<P> = Omit<NextApiRequest, 'query' | 'body'> & { query?: P, body?: P }

type PrimitivesMiddleware<T> =
  T extends
  string |
  number |
  boolean
  ? { value: T } : T

export type successFn<T> = (statusCode: number, data: T) => void
export type failFn<E> = (statusCode: number, data: E extends DefaultError ? string : E) => void

export type NextMethod<
  T,
  P = any,
  E extends Record<string, any> = DefaultError
  > = (items: {
    query: P
    body: P
    req: NextApiParamsRequest<PrimitivesMiddleware<P>>
    res: NextApiResponse<T> & {
      success: successFn<T>
      fail: failFn<E>
    }
    success: successFn<T>
    fail: failFn<E>
  }) => void

export type METHODS = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type MethodNextHandlerBase = {
  [X in METHODS]?: NextMethod<any> | ((p: any, e?: any) => any)
}
export type NextMethodsHandler<Base extends MethodNextHandlerBase> = {
  [X in keyof Base]?: Base[X]
}

export type getType<H extends NextMethod<unknown, unknown, unknown>> = H extends NextMethod<infer K, any, any> ? K : any
export type getParam<H extends NextMethod<unknown, unknown, unknown>> = H extends NextMethod<any, infer K, any> ? K : any
export type getError<H extends NextMethod<unknown, unknown, unknown>> = H extends NextMethod<any, any, infer K> ? K : any

  // get: FetchFromBase<Handler, "GET">,
  // put: FetchFromBase<Handler, "PUT">,
  // post: FetchFromBase<Handler, "POST">,
  // delete: FetchFromBase<Handler, "DELETE">,

// TESTS ZONE
// just to try-error advanced types
 
type T = { name: string }

type a = NextMethodsHandler<{
  GET: NextMethod<T, { id: string }>,
  POST: NextMethod<T, { data: number }, { die: boolean }>,
  PUT: NextMethod<T, { id: string }>,
  DELETE: NextMethod<T, { id: string }>,
}>

export type IfHasMethod< 
  H extends { [x: string]: any }, 
  M extends METHODS,
  YES extends any,
  NO extends any = {}
> = 
  Required<H> extends { [ x in M ]: NextMethod<any> } ? YES : NO

type construct<M extends METHODS> = a[M]

const a: NextMethodsHandler<{ 
  GET: NextMethod<T, {filter: string}>,
  PUT: NextMethod<T, {id: string}>,
  POST: NextMethod<T, {shit: string}>,
}> = {
  GET: ({ req, res }) => {
    req.query.filter
    res.send({ 
      name: 'a'
    })
  },
  POST: ({ req, res }) => {
    req.body.shit
    res.send({
      name: 'a'
    })
  },
  PUT: ({ req, res }) => {
    req.query.id
    res.send({
      name: 'a'
    })
  }  
}

/*
type Item<c extends Record<string, Item<{}>> = {}> = {
  name: string
  routes?: {
    [k in keyof c]: Item<c[k]['routes']>
  }
}

const subSub: Item = {
  name: 'subsub'
}

const subChild: Item<{ sub: typeof subSub }> = {
  name: 'subChild',
  routes: { sub: subSub }
}

const child: Item<{ sub: typeof subChild }> = {
  name: 'child1',
  routes: {
    sub: subChild
  }
}

const parent: Item<{
  child1: typeof child
}> = {
  name: 'parent',
  routes: {
    child1: child
  }
}

parent.routes.child1.routes.sub.routes.sub

const Create: <R extends Record<string, Item>>(name: string, t: R) => Item<R> 
  = (name, t) => {
  return {
    name,
    routes: t as any
  } as any
}

const b = Create('b', {})
const a = Create<{ b: Item<{}> }>('a',{ b })

a.name
a.routes.b.name

const l = ['a','b','c']
*/
