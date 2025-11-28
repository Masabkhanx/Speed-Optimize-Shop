const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const port = process.env.PORT || 3003
const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
app.prepare()
 .then(() => {
   createServer((req, res) => {
     try {
       const parsedUrl = parse(req.url, true)
       const { pathname, query } = parsedUrl
       // Health check route
       if (pathname === '/health') {
         res.writeHead(200, { 'Content-Type': 'text/plain' })
         res.end('Server is running\n')
         return
       }
       // Custom routes
       if (pathname === '/a') {
         app.render(req, res, '/a', query)
       } else if (pathname === '/b') {
         app.render(req, res, '/b', query)
       } else {
         handle(req, res, parsedUrl)
       }
     } catch (err) {
       console.error('Request error:', err)
       res.writeHead(500, { 'Content-Type': 'text/plain' })
       res.end('Internal Server Error\n')
     }
   }).listen(port, (err) => {
     if (err) {
       console.error('Server failed to start:', err)
       process.exit(1)
     }
     console.log(`> Ready on http://localhost:${port}`)
   })
 })
 .catch(err => {
   console.error('Next.js failed to prepare:', err)
   process.exit(1)
 })