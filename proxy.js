const axios = require('axios');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = require('express')();

const { PORT = 80 } = process.env;

let tokens = {};
let config = null;

const getTokens = async () => {
  console.log(`[Proxy] Fetching Tokens`);
  config.forEach(async ({ target }) => {
    const { data } = await axios.get(`http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${target}`, {
      headers: {
        'Metadata-Flavor': 'Google'
      }
    });
    token[target] = data;
  });
};

const getConfig = async () => {
  console.log(`[Proxy] Fetching Config`);
  const { data } = await axios.get(`http://metadata.google.internal/computeMetadata/v1/instance/proxyconfig`, {
    headers: {
      'Metadata-Flavor': 'Google'
    }
  });

  config = typeof data === 'object' ? data : JSON.parse(data);
  console.log(config);
};

app.send('/proxy/config', (_, res) => {
  res.send(config)
});

app.get('/proxy/health', (_, res) => {
  res.status(200).send();
});

(async () => {
  await getConfig();
  await getTokens();
  setInterval(getTokens, 1.8e+6);
  config.forEach(({ target, path }) => {
    app.use(path, createProxyMiddleware({
      target: target,
      pathRewrite: path !== '*' ? {
        // Remove Base Path
        [`^/${path}/`]: '/',
      } : undefined,
      changeOrigin: true,
      onProxyReq: async function (proxyReq) {
        proxyReq.setHeader('Authorization', `Bearer ${tokens[target]}`);
      }
    }));
  });
})();

app.listen(PORT, () => {
  console.log(`Application Listening on ${PORT}`);
});
