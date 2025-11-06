// n8n API configuration
const N8N_API = process.env.N8N_API;
const N8N_API_KEY = process.env.N8N_API_KEY;

export const handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    if (!N8N_API) {
        return { statusCode: 500, body: 'N8N_API not configured. Please set the n8n API URL.' };
    }

    // Extract execution id from the path
    const parts = event.path ? event.path.split('/') : [];
    const executionId = parts.length ? parts[parts.length - 1] : null;
    if (!executionId) {
        return { statusCode: 400, body: 'Missing execution id in path' };
    }

    // Construct the n8n API URL for checking execution status
    const target = `${N8N_API}/executions/${executionId}`;

    try {
        const resp = await fetch(target, {
            headers: {
                ...(N8N_API_KEY && { 'X-N8N-API-KEY': N8N_API_KEY }),
                'Accept': 'application/json'
            }
        });

        if (!resp.ok) {
            console.error(`n8n API error (${resp.status}):`, await resp.text());
            return {
                statusCode: resp.status,
                body: JSON.stringify({
                    error: 'Failed to fetch execution status',
                    status: 'error',
                    message: `n8n API returned ${resp.status}`
                })
            };
        }

        const data = await resp.json();

        // Transform n8n execution data into our status format
        const status = {
            executionId,
            status: data.finished ? 'completed' : 'processing',
            message: data.finished ? 'Workflow execution completed' : 'Workflow is still running',
            data: data.finished ? data.data : undefined
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(status)
        };
    } catch (err) {
        console.error('Status check error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to check execution status',
                status: 'error',
                message: err.message
            })
        };
    }
};