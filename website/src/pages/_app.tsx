import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import '@/styles/globals.css'
import Navbar from '@/components/navbar'
import RootLayout from '@/components/layouts/RootLayout'
import { AuthProvider } from '@/hooks/auth-context'

// 创建一个 client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 窗口获得焦点时不重新获取数据
      retry: 1, // 失败重试次数
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Head>
        <title>ParalHub</title>
        <meta name="description" content="发现和分享并行计算案例" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <RootLayout>
          <Navbar />
          <Component {...pageProps} />
        </RootLayout>
      </QueryClientProvider>
    </AuthProvider>
  )
}