/* eslint-disable */
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function(app) {
	app.use(
		'/api',
		createProxyMiddleware({
			target: 'https://fenix.tecnico.ulisboa.pt/',
			changeOrigin: true,
			pathRewrite: async function (path, req) {
				return path.replace('/', '/api/fenix/v1/')
			}
		})
	)
	app.use(
		'/v2api',
		createProxyMiddleware({
			target: 'https://fenix.tecnico.ulisboa.pt/',
			changeOrigin: true,
			pathRewrite: async function (path, req) {
				return path.replace('/', '/tecnico-api/v2/')
			}
		})
	)
}