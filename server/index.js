const express = require("express")
const { createProxyMiddleware } = require('http-proxy-middleware')
const path = require('path')

const app = express()
app.use(express.static(path.join(__dirname, '../build')))

app.get('/horarios', function (req, res) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.use(
  '/api',
  createProxyMiddleware({
      target: 'https://fenix.tecnico.ulisboa.pt/',
      changeOrigin: true,
      pathRewrite: {
          '^/api': '/api/fenix/v1'
      }
  })
)
app.use(
  '/tinyurl',
  createProxyMiddleware({
      target: 'https://tinyurl.com/',
      changeOrigin: true,
      pathRewrite: {
          '^/tinyurl': ''
      }
  })
)

app.listen(4000, () => {
  console.log("Server started on port 5000");
});