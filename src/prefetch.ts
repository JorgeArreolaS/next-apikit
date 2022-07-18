import { GetServerSideProps } from 'next'
import { dehydrate, QueryClient } from 'react-query'

export const apiPrefetch = async (
  queries: Array< (queryClient: QueryClient) => Promise<void>  >
) => {

  const queryClient = new QueryClient()

  for (let query of queries)
    await query(queryClient)

  return dehydrate(queryClient)
}

export const gSSPwithPrefetch: (
  queries: Array<(queryClient: QueryClient) => Promise<void>>,
  base?: GetServerSideProps
) => GetServerSideProps = 
  (
    queries = [], 
    base = async () => ({ props: {} })
  ) => {
  return async (cxt) => {
    const res = await base(cxt) as any
    res.props.dehydratedState = await apiPrefetch(queries)
    return res
  }
}
