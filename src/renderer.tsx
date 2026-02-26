import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        {import.meta.env.PROD ? (
          <>
            <link href="/static/style.css" rel="stylesheet" />
            <script type="module" src="/static/client.js" />
          </>
        ) : (
          <>
            <link href="/src/style.css" rel="stylesheet" />
            <script type="module" src="/src/client.tsx" />
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  )
})
