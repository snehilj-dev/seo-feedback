import fetch from 'node-fetch';

// Vercel serverless function for status endpoint that forwards to a public n8n webhook
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { jobId = '' } = req.query;
    const statusEndpoint = process.env.TARGET_STATUS_WEBHOOK || '';

    if (!jobId) {
        return res.status(400).json({ error: 'No jobId provided' });
    }

    if (!statusEndpoint) {
        return res.status(500).json({
            error: 'TARGET_STATUS_WEBHOOK not configured',
            message: 'Set the public n8n status webhook URL in the environment before calling this endpoint.'
        });
    }

    try {
        const url = new URL(statusEndpoint);
        url.searchParams.set('jobId', jobId);

        const forwardRes = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        const text = await forwardRes.text();
        const contentType = forwardRes.headers.get('content-type') || 'application/json';

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        res.status(forwardRes.status);

        if (contentType.includes('application/json')) {
            try {
                return res.json(JSON.parse(text));
            } catch (err) {
                console.warn('Failed to parse status webhook JSON response, returning raw text');
            }
        }

        return res.send(text);
    } catch (err) {
        console.error('Error calling status webhook for jobId', jobId, err);
        return res.status(500).json({ error: String(err) });
    }
}