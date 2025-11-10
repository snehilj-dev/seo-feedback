// Simple server-side proxy to forward requests to the n8n webhook
// Run with: node server/proxy.js (requires Node 18+ with global fetch)

import http from 'http';
import 'dotenv/config';

// Load environment variables with fallbacks
const TARGET = process.env.TARGET_WEBHOOK || 'https://n8n-excollo.azurewebsites.net/webhook/528aa770-e351-4ae0-9626-38b398e40487';
const TARGET_STATUS = process.env.TARGET_STATUS_WEBHOOK || '';
const PORT = process.env.PORT || 3001;
const N8N_API = process.env.N8N_API || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Log startup configuration (excluding sensitive data)
console.log('Starting proxy with configuration:');
console.log('- PORT:', PORT);
console.log('- N8N_API:', N8N_API);
console.log('- TARGET webhook configured:', !!TARGET);
console.log('- TARGET status webhook configured:', !!TARGET_STATUS);

function sendJSON(res, status, obj) {
    const s = JSON.stringify(obj);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(s),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Accept'
    });
    res.end(s);
}

// In-memory stores for execution status and polling intervals
const executionStore = new Map();
const pollingIntervals = new Map();

// Function to poll n8n API for execution status
async function pollExecutionStatus(execId) {
    if (!N8N_API) return;

    try {
        const fetchFn = global.fetch || (await import('node-fetch')).default;
        const apiRes = await fetchFn(`${N8N_API}/executions/${execId}`, {
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!apiRes.ok) {
            console.error(`Failed to poll execution ${execId}:`, await apiRes.text());
            return;
        }

        const apiJson = await apiRes.json();
        const normalized = {
            executionId: execId,
            status: apiJson.finished ? 'completed' : 'processing',
            message: apiJson.message || null,
            result: apiJson,
            cachedAt: Date.now()
        };

        executionStore.set(execId, normalized);

        // If execution is finished, stop polling
        if (apiJson.finished) {
            console.log(`Execution ${execId} completed, stopping poll`);
            clearInterval(pollingIntervals.get(execId));
            pollingIntervals.delete(execId);
        }
    } catch (err) {
        console.error(`Error polling execution ${execId}:`, err);
    }
}

const server = http.createServer(async (req, res) => {
    // Basic CORS preflight handling
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Accept',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/seo-feedback') {
        try {
            // Collect request body
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = Buffer.concat(chunks).toString();

            // Forward to target webhook using fetch (Node 18+) with timeout
            const fetchFn = global.fetch || (await import('node-fetch')).default;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 360000); // 6 minute timeout

            try {
                const forwardRes = await fetchFn(TARGET, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json, application/pdf'
                    },
                    body,
                    signal: controller.signal
                });

                clearTimeout(timeout);

                // Handle response errors
                if (!forwardRes.ok) {
                    const errorText = await forwardRes.text();
                    console.error('Target error:', forwardRes.status, errorText);
                    sendJSON(res, forwardRes.status, {
                        error: 'Target error',
                        status: forwardRes.status,
                        message: errorText
                    });
                    return;
                }

                // Pipe response back to client preserving content-type
                const contentType = forwardRes.headers.get('content-type') || 'application/octet-stream';
                const arrayBuffer = await forwardRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                // If the response is JSON, try to parse and cache an execution id/status
                if (contentType.includes('application/json')) {
                    try {
                        const text = buffer.toString('utf8');
                        const parsed = JSON.parse(text);

                        // Normalise to first item if an array is returned
                        const item = Array.isArray(parsed) ? parsed[0] : parsed;
                        if (item && (item.executionId || item.id)) {
                            // use executionId if present, otherwise id
                            const execId = String(item.executionId || item.id);
                            const normalized = {
                                executionId: execId,
                                status: item.status || item.state || 'processing',
                                message: item.message || null,
                                result: item,
                                cachedAt: Date.now()
                            };
                            executionStore.set(execId, normalized);

                            // Start server-side polling if N8N_API is configured
                            if (N8N_API && !pollingIntervals.has(execId)) {
                                console.log(`Starting poll for execution ${execId}`);
                                const interval = setInterval(() => pollExecutionStatus(execId), 5000);
                                pollingIntervals.set(execId, interval);

                                // Safety: stop polling after 10 minutes
                                setTimeout(() => {
                                    if (pollingIntervals.has(execId)) {
                                        clearInterval(pollingIntervals.get(execId));
                                        pollingIntervals.delete(execId);
                                        console.log(`Stopped polling ${execId} after timeout`);
                                    }
                                }, 600000);
                            }
                        }
                    } catch (e) {
                        // ignore JSON parse errors
                    }
                }

                // Return the target response unchanged to the client
                res.writeHead(forwardRes.status, {
                    'Content-Type': contentType,
                    'Content-Length': buffer.length,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(buffer);

            } catch (fetchError) {
                clearTimeout(timeout);
                if (fetchError.name === 'AbortError') {
                    sendJSON(res, 504, {
                        error: 'Gateway Timeout',
                        message: 'Request took too long to complete'
                    });
                } else {
                    throw fetchError; // Re-throw for general error handling
                }
            }

        } catch (err) {
            console.error('Proxy error:', err);
            sendJSON(res, err.name === 'AbortError' ? 504 : 500, {
                error: 'Proxy error',
                message: String(err)
            });
        }
        return;
    }

    // POST /seo-feedback/result - push endpoint for n8n to POST final results
    if (req.method === 'POST' && req.url === '/seo-feedback/result') {
        try {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const body = Buffer.concat(chunks).toString();
            let parsed;
            try {
                parsed = JSON.parse(body);
            } catch (e) {
                parsed = { raw: body };
            }

            // try common locations for execution id
            const execId = String(
                parsed.executionId || parsed.id ||
                (Array.isArray(parsed) && parsed[0] && (parsed[0].executionId || parsed[0].id)) ||
                parsed.execId || parsed.execution_id || ''
            );

            if (!execId) {
                sendJSON(res, 400, { error: 'No executionId found in payload' });
                return;
            }

            const normalized = {
                executionId: execId,
                status: parsed.status || 'completed',
                message: parsed.message || null,
                result: parsed,
                cachedAt: Date.now()
            };

            executionStore.set(execId, normalized);
            sendJSON(res, 200, { ok: true, executionId: execId });
            return;
        } catch (err) {
            console.error('Error on /seo-feedback/result:', err);
            sendJSON(res, 500, { error: String(err) });
            return;
        }
    }

    // Status polling endpoint with active n8n polling
    if (req.method === 'GET' && req.url && req.url.startsWith('/seo-feedback/status')) {
        if (TARGET_STATUS) {
            try {
                const urlObj = new URL(req.url, `http://localhost:${PORT}`);
                let jobId = urlObj.searchParams.get('jobId');

                if (!jobId) {
                    const parts = urlObj.pathname.split('/');
                    jobId = parts[parts.length - 1] || '';
                    if (jobId === 'status') {
                        jobId = '';
                    }
                }

                if (!jobId) {
                    sendJSON(res, 400, { error: 'No jobId provided' });
                    return;
                }

                const forwardUrl = new URL(TARGET_STATUS);
                forwardUrl.searchParams.set('jobId', jobId);

                const fetchFn = global.fetch || (await import('node-fetch')).default;
                const forwardRes = await fetchFn(forwardUrl.toString(), {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    }
                });

                const text = await forwardRes.text();
                const contentType = forwardRes.headers.get && forwardRes.headers.get('content-type') || 'application/json';

                res.writeHead(forwardRes.status, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(text);
            } catch (err) {
                console.error('Status proxy error:', err);
                sendJSON(res, 500, { error: String(err) });
            }
            return;
        }

        const parts = req.url.split('/');
        const execId = parts[parts.length - 1];

        // Always try to get fresh status from n8n first if API is configured
        if (N8N_API) {
            try {
                const fetchFn = global.fetch || (await import('node-fetch')).default;
                const apiRes = await fetchFn(`${N8N_API}/executions/${execId}`, {
                    headers: {
                        'X-N8N-API-KEY': N8N_API_KEY,
                        'Accept': 'application/json'
                    }
                });

                if (apiRes.ok) {
                    const apiJson = await apiRes.json();
                    const normalized = {
                        executionId: execId,
                        status: apiJson.finished ? 'completed' : 'processing',
                        message: apiJson.message || null,
                        result: apiJson,
                        cachedAt: Date.now()
                    };
                    // Update cache
                    executionStore.set(execId, normalized);
                    sendJSON(res, 200, normalized);
                    return;
                }
                // Fall through to cache if API call fails
            } catch (err) {
                console.error('Error polling n8n API:', err);
                // Fall through to cache
            }
        }

        // Return cached version if available
        if (executionStore.has(execId)) {
            const entry = executionStore.get(execId);
            const normalized = {
                executionId: String(execId),
                status: entry.status || 'processing',
                message: entry.message || null,
                result: entry.result || entry,
                cachedAt: entry.cachedAt || Date.now()
            };
            sendJSON(res, 200, normalized);
            return;
        }

        // If we get here, no fresh data and no cache
        if (N8N_API) {
            try {
                const fetchFn = global.fetch || (await import('node-fetch')).default;
                // Call n8n API with authentication
                const apiRes = await fetchFn(`${N8N_API}/executions/${execId}`, {
                    headers: {
                        'X-N8N-API-KEY': N8N_API_KEY,
                        'Accept': 'application/json'
                    }
                });
                if (!apiRes.ok) {
                    const txt = await apiRes.text();
                    sendJSON(res, apiRes.status, { error: txt });
                    return;
                }
                const apiJson = await apiRes.json();
                const normalized = {
                    executionId: execId,
                    status: apiJson.status || (apiJson.execution && apiJson.execution.status) || 'completed',
                    message: apiJson.message || null,
                    result: apiJson,
                    cachedAt: Date.now()
                };
                executionStore.set(execId, normalized);
                sendJSON(res, 200, normalized);
                return;
            } catch (err) {
                console.error('Error fetching n8n API for execId', execId, err);
                // fall through to 404
            }
        }

        sendJSON(res, 404, { error: 'Not found' });
        return;
    }

    // Not found
    sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
    console.log(`Proxy server listening on http://localhost:${PORT}`);
});