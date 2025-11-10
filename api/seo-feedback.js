import fetch from 'node-fetch';

// Vercel serverless function
export default async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const targetEndpoint = process.env.TARGET_WEBHOOK || '';

    if (!targetEndpoint) {
        return res.status(500).json({
            error: 'TARGET_WEBHOOK not configured',
            message: 'Set the public n8n submit webhook URL in the environment before calling this endpoint.'
        });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 360000); // 6 minute timeout

        const forwardRes = await fetch(targetEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, application/pdf'
            },
            body: JSON.stringify(req.body),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!forwardRes.ok) {
            const errorText = await forwardRes.text();
            console.error('Target error:', forwardRes.status, errorText);
            return res.status(forwardRes.status).json({
                error: 'Target error',
                status: forwardRes.status,
                message: errorText
            });
        }

        const contentType = forwardRes.headers.get('content-type') || 'application/octet-stream';
        const buffer = await forwardRes.arrayBuffer();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        res.status(forwardRes.status);

        if (contentType.includes('application/json')) {
            const text = Buffer.from(buffer).toString('utf8');
            try {
                return res.json(JSON.parse(text));
            } catch (err) {
                console.warn('Failed to parse submit webhook JSON response, returning raw text');
                return res.send(text);
            }
        }

        return res.send(Buffer.from(buffer));

    } catch (err) {
        console.error('Proxy error:', err);
        return res.status(err.name === 'AbortError' ? 504 : 500).json({
            error: 'Proxy error',
            message: String(err)
        });
    }
}