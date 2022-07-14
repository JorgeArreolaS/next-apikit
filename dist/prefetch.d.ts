import { GetServerSideProps } from 'next';
import { QueryClient } from 'react-query';
export declare const apiPrefetch: (queries: ((queryClient: QueryClient) => Promise<void>)[]) => Promise<import("react-query").DehydratedState>;
export declare const gSSPwithPrefetch: (queries: Array<(queryClient: QueryClient) => Promise<void>>, base?: GetServerSideProps) => GetServerSideProps;
