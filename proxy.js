const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = require('express')();

const { PORT = 8080, TARGET } = process.env;

let token;

const refreshToken = async () => {
  const { data } = await axios.get(`http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${TARGET}`, {
    headers: {
      'Metadata-Flavor': 'Google'
    }
  });
  token = data;
}

// Refresh Token Immediately & then every half hour
refreshToken();
setInterval(refreshToken, 1.8e+6)

app.use('*', createProxyMiddleware({
  target: TARGET,
  changeOrigin: true,
  onProxyReq: async function (proxyReq) {
    proxyReq.setHeader('Authorization', `Bearer ${token}`);
  }
}));

app.listen(PORT, () => {
  console.log(`Application Listening on ${PORT}`);
});