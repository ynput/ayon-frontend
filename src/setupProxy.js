const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use('/api', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true, }));
  app.use('/graphql', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true, }));
  app.use('/graphiql', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true, }));
  app.use('/docs', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true, }));
  app.use('/openapi.json', createProxyMiddleware({ target: 'http://localhost:5000', changeOrigin: true, }));
};
