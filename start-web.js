var express = require("express")

let server = express()

server.use(
    express.static('dist.browser/client', {
    setHeaders: function (res, path, stat) {
      res.set('Cross-Origin-Embedder-Policy', 'require-corp')
      res.set('Cross-Origin-Opener-Policy', 'same-origin')
    }
    }),
)
server.use('/three', express.static('node_modules/three', {
    setHeaders: function (res, path, stat) {
        res.set('Cross-Origin-Embedder-Policy', 'require-corp')
        res.set('Cross-Origin-Opener-Policy', 'same-origin')
    }
}))
server.use('/socket.io-client', express.static('node_modules/socket.io-client/dist', {
    setHeaders: function (res, path, stat) {
        res.set('Cross-Origin-Embedder-Policy', 'require-corp')
        res.set('Cross-Origin-Opener-Policy', 'same-origin')
    }
}))

server.listen(5000)
console.log('serving content on http://localhost:5000')
