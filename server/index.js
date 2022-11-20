const express = require("express")
const { createProxyMiddleware } = require('http-proxy-middleware')
const path = require('path')
const morgan = require('morgan')
const fs = require('fs'), https = require('https');

const privateKey = fs.readFileSync( './server/private.pem' );
const certificate = fs.readFileSync( './server/certificate.pem' );

const app = express()

app.use(morgan('common', {
  skip: function (req, res) {
    return req.url !== '/' && !req.url.includes('api') && !req.url.includes('disciplinas')
  }
}));
app.use(express.static(path.join(__dirname, '../build_deploy'), {fallthrough: true}))

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

app.get('*', function(req, res){
  res.sendFile(path.join(__dirname, '../public/maintenance.html'));
});

https.createServer({
	    key: privateKey,
	    cert: certificate
}, app).listen(443, () => {
  console.log("Server started on port 443");
});

// app.listen(5000, () => {})
