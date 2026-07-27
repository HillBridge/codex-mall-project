import { app } from './app.mjs'

const port = Number(process.env.BACKEND_PORT || 4000)
const host = process.env.BACKEND_HOST || '127.0.0.1'

app.listen(port, host, () => {
  console.log(`Koa backend listening on http://${host}:${port}`)
})
