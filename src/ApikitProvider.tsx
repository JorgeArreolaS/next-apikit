import { Hydrate, QueryClientProvider, QueryClient } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { useState } from 'react'

export const ApikitProvider: React.FC<{ 
  children: React.ReactElement,
  pageProps: any
}> = ({ children, pageProps }) => {

  const [ queryClient ] = useState(() => new QueryClient() )

  return (
    <QueryClientProvider client={queryClient} contextSharing={true}>
      <Hydrate state={pageProps.dehydratedState}>
        { children }
      </Hydrate>
      <ReactQueryDevtools initialIsOpen={false}/>
    </QueryClientProvider>
  )
}

