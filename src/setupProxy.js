/* eslint-disable */
const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function(app) {
	app.use(
		'/horarios/api',
		createProxyMiddleware({
			target: 'https://fenix.tecnico.ulisboa.pt/',
			changeOrigin: true,
			pathRewrite: {
				'^/horarios/api': '/api/fenix/v1'
			}
		})
	)
	app.use(
		'/horarios/tinyurl',
		createProxyMiddleware({
			target: 'https://tinyurl.com/',
			changeOrigin: true,
			pathRewrite: {
				'^/horarios/tinyurl': ''
			}
		})
	)
}