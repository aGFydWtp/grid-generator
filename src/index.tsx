import { Hono } from 'hono'
// import { render } from 'hono/jsx/dom'
import { CSSGridGenerator } from './editor'
import type { FC } from 'hono/jsx'

// function App() {
//   return (
//     <html>
//       <body>
//         <CSSGridGenerator />
//       </body>
//     </html>
//   )
// }

// const root = document.getElementById('root')
// render(<App />, root)

const app = new Hono()

app.get('/', (c) => {
  return c.html(
    <html>
      <body>
        <CSSGridGenerator />
      </body>
    </html>
  )
})

export default app
