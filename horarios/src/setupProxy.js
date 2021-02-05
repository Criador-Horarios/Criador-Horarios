// import { createProxyMiddleware } from 'http-proxy-middleware'
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function(app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'https://fenix.tecnico.ulisboa.pt/',
            changeOrigin: true,
        })
    )
}