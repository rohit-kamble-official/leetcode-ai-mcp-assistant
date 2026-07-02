/**
 * App.jsx — Root: providers, theme init, routing.
 */
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AppRouter } from './routes'
// themeStore applies the `dark` class itself (on init, on setTheme, and
// on OS theme-change events for 'system' mode) — no separate
// initializer component is needed here. The previous ThemeInitializer
// duplicated this with `theme === 'dark'`, which broke as soon as a
// 'system' theme option was introduced (it would stay light even when
// the OS was in dark mode, since it never checked resolvedTheme).
import './store/themeStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
            success: {
              style: { background: '#064e3b', color: '#ecfdf5', border: '1px solid #065f46' },
              iconTheme: { primary: '#10b981', secondary: '#ecfdf5' },
            },
            error: {
              style: { background: '#7f1d1d', color: '#fef2f2', border: '1px solid #991b1b' },
              iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
