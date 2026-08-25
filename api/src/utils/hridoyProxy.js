const axios = require('axios');
const { PassThrough, Transform } = require('stream');

const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ==================== HEADERS ====================

const createCommonHeaders = (origin = 'https://htvlive.vercel.app') => ({
    'User-Agent': DEFAULT_UA,
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': origin,
    'Referer': `${origin}/`,
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive'
});

const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
};

const setProxyHeaders = (res, upstreamRes, defaultType) => {
    setCorsHeaders(res);
    res.setHeader('Content-Type', upstreamRes.headers['content-type'] || defaultType);
    if (upstreamRes.headers['cache-control']) {
        res.setHeader('Cache-Control', upstreamRes.headers['cache-control']);
    }
    if (upstreamRes.headers['content-length']) {
        res.setHeader('Content-Length', upstreamRes.headers['content-length']);
    }
};

// ✅ Extended CORS for Sony/Temp-Play
const setExtendedCors = (res, req, opts = {}) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', opts.methods || 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', opts.headers || '*');
    if (opts.credentials) res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (opts.expose) res.setHeader('Access-Control-Expose-Headers', opts.expose);
    if (opts.maxAge) res.setHeader('Access-Control-Max-Age', opts.maxAge);
    if (opts.cacheControl) res.setHeader('Cache-Control', opts.cacheControl);
    if (opts.pragma) res.setHeader('Pragma', opts.pragma);
    if (opts.expires) res.setHeader('Expires', opts.expires);
};

// ==================== FETCH ====================

const fetchStream = (url, headers) =>
    axios({ method: 'GET', url, headers, responseType: 'stream', timeout: 30000 });

const fetchBuffer = (url, headers) =>
    axios({ method: 'GET', url, headers, responseType: 'arraybuffer', timeout: 30000 });

// ==================== STREAM ====================

const pipeStream = (upstreamRes, expressRes, defaultType) => {
    setProxyHeaders(expressRes, upstreamRes, defaultType);
    const stream = new PassThrough();
    upstreamRes.data.pipe(stream);
    stream.pipe(expressRes);

    stream.on('error', () => {
        if (!expressRes.headersSent) {
            expressRes.status(500).json({ error: 'Stream error occurred' });
        }
    });
    return stream;
};

const createM3u8Transform = (rules) => {
    return new Transform({
        transform(chunk, encoding, callback) {
            try {
                let data = chunk.toString('utf8');
                for (const rule of rules) {
                    data = data.replace(rule.regex, rule.replacement);
                }
                callback(null, Buffer.from(data, 'utf8'));
            } catch (err) {
                callback(err);
            }
        }
    });
};

// ==================== ERROR / OPTIONS ====================

const handleProxyError = (error, res, messages = {}) => {
    if (res.headersSent) return;
    const status = error.response?.status || 500;
    const msg = messages[status] || messages.default || 'Request failed';
    res.status(status).json({ error: msg, details: error.message });
};

const sendOptions = (res, maxAge = '86400') => {
    setCorsHeaders(res);
    res.setHeader('Access-Control-Max-Age', maxAge);
    res.status(204).send();
};

// ==================== HELPERS ====================

const normalizePath = (param) => {
    let path = param || '';
    if (path && !path.startsWith('/')) path = '/' + path;
    return path;
};

const appendQueryString = (req, targetUrl) => {
    if (req.url.includes('?')) {
        const qs = req.url.split('?')[1];
        return `${targetUrl}?${qs}`;
    }
    return targetUrl;
};

module.exports = {
    createCommonHeaders,
    setCorsHeaders,
    setProxyHeaders,
    setExtendedCors,
    fetchStream,
    fetchBuffer,
    pipeStream,
    createM3u8Transform,
    handleProxyError,
    sendOptions,
    normalizePath,
    appendQueryString
};