import fetch from 'node-fetch';

// Vercel serverless function for status endpoint
export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { executionId } = req.query;
    const N8N_API = process.env.N8N_API || '';
    const N8N_API_KEY = process.env.N8N_API_KEY || '';

    if (!executionId) {
        return res.status(400).json({ error: 'No executionId provided' });
    }

    if (!N8N_API) {
        return res.status(404).json({ error: 'Not found' });
    }

    try {
        const apiRes = await fetch(`${N8N_API}/executions/${executionId}`, {
            headers: {
                'X-N8N-API-KEY': N8N_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!apiRes.ok) {
            const txt = await apiRes.text();
            return res.status(apiRes.status).json({ error: txt });
        }

        const apiJson = await apiRes.json();
        const normalized = {
            executionId,
            status: apiJson.finished ? 'completed' : 'processing',
            message: apiJson.message || null,
            result: apiJson,
            cachedAt: Date.now()
        };

        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.json(normalized);

    } catch (err) {
        console.error('Error fetching n8n API for execId', executionId, err);
        return res.status(500).json({ error: String(err) });
    }
}