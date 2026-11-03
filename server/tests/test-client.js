const http = require('http');
const { PassThrough } = require('stream');

function createTestClient(app) {
  function makeRequest(method, url, options = {}) {
    const { body, headers = {}, cookies = {} } = options;

    return new Promise((resolve, reject) => {
      const socket = new PassThrough();
      socket.remoteAddress = '127.0.0.1';
      socket.encrypted = false;

      const req = new http.IncomingMessage(socket);
      req.method = method.toUpperCase();
      req.url = url;
      req.originalUrl = url;
      req.ip = '127.0.0.1';
      req.headers = {
        'content-type': 'application/json',
        ...headers
      };
      req.cookies = { ...cookies };

      if (Object.keys(cookies).length > 0 && !req.headers.cookie) {
        req.headers.cookie = Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
      }

      if (body) {
        req.body = body;
        const jsonStr = typeof body === 'string' ? body : JSON.stringify(body);
        req.headers['content-length'] = Buffer.byteLength(jsonStr);
      }

      const res = new http.ServerResponse(req);
      res.assignSocket(socket);

      let responseBody = '';
      const originalWrite = res.write.bind(res);
      const originalEnd = res.end.bind(res);

      res.write = function (chunk, ...args) {
        if (chunk) {
          responseBody += chunk.toString();
        }
        return originalWrite(chunk, ...args);
      };

      res.end = function (chunk, ...args) {
        if (chunk) {
          responseBody += chunk.toString();
        }
        originalEnd(chunk, ...args);

        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody);
        } catch (e) {}

        const resHeaders = res.getHeaders();
        const setCookie = res.getHeader('set-cookie') || [];

        return resolve({
          status: res.statusCode,
          headers: {
            ...resHeaders,
            'set-cookie': Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : [])
          },
          body: parsed
        });
      };

      app.handle(req, res, (err) => {
        if (err) return reject(err);
        resolve({
          status: 404,
          headers: res.getHeaders(),
          body: { message: 'Not found' }
        });
      });

      process.nextTick(() => {
        if (body) {
          const jsonStr = typeof body === 'string' ? body : JSON.stringify(body);
          req.push(jsonStr);
        }
        req.push(null);
      });
    });
  }

  return {
    get: (url, opts) => makeRequest('GET', url, opts),
    post: (url, opts) => makeRequest('POST', url, opts),
    put: (url, opts) => makeRequest('PUT', url, opts),
    patch: (url, opts) => makeRequest('PATCH', url, opts),
    delete: (url, opts) => makeRequest('DELETE', url, opts)
  };
}

module.exports = { createTestClient };
