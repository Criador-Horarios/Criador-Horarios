const express = require("express")
const { createProxyMiddleware } = require('http-proxy-middleware')
const path = require('path')
const morgan = require('morgan')
const fs = require('fs'), https = require('https');

// const privateKey = fs.readFileSync( '/var/keys/private.pem' );
// const certificate = fs.readFileSync( '/var/keys/certificate.pem' );

const app = express()

app.use(morgan('common', {
  skip: function (req, res) {
    return req.url !== '/' && !req.url.includes('api') && !req.url.includes('disciplinas')
  }
}));
app.use(express.static(path.join(__dirname, '../build'), { fallthrough: true }))

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
  '/disciplinas',
  createProxyMiddleware({
    target: 'https://fenix.tecnico.ulisboa.pt/',
    changeOrigin: true,
  })
)

app.get('*', function(_req, res){
  res.sendFile(path.join(__dirname, '../public/maintenance.html'));
});

// https.createServer({ key: privateKey, cert: certificate }, app)
// 	.listen(443, () => {
//   console.log("Server started on port 443");
// });

app.listen(5000, () => {
	console.log("Server started on port 5000");
})
