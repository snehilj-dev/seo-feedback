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

    const TARGET = process.env.TARGET_WEBHOOK || 'https://n8n-excollo.azurewebsites.net/webhook/528aa770-e351-4ae0-9626-38b398e40487';

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 360000); // 6 minute timeout

        const forwardRes = await fetch(TARGET, {
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
        const data = await forwardRes.buffer();

        // Handle JSON responses for execution tracking
        if (contentType.includes('application/json')) {
            try {
                const parsed = JSON.parse(data.toString());
                const item = Array.isArray(parsed) ? parsed[0] : parsed;
                if (item && (item.executionId || item.id)) {
                    const execId = String(item.executionId || item.id);
                    // Store execution info in your preferred storage solution
                    // For Vercel, consider using Vercel KV, Redis, or other storage solutions
                }
            } catch (e) {
                // ignore JSON parse errors
            }
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(data);

    } catch (err) {
        console.error('Proxy error:', err);
        return res.status(err.name === 'AbortError' ? 504 : 500).json({
            error: 'Proxy error',
            message: String(err)
        });
    }
}