// n8n webhook function - handles POST requests to start workflow executions
export const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Get configuration from environment variables
    const target = process.env.TARGET_WEBHOOK;
    const apiKey = process.env.N8N_API_KEY;

    if (!target) {
        return { statusCode: 500, body: 'TARGET_WEBHOOK not configured. Please set the n8n webhook URL.' };
    }

    try {
        const resp = await fetch(target, {
            method: 'POST',
            headers: {
                // Include n8n API key if provided
                ...(apiKey && { 'X-N8N-API-KEY': apiKey }),
                'Content-Type': event.headers['content-type'] || event.headers['Content-Type'] || 'application/json',
            },
            body: event.body,
        });

        const contentType = resp.headers.get && resp.headers.get('content-type');
        const bodyText = await resp.text();

        // Parse response to check for n8n-specific errors
        if (!resp.ok) {
            console.error('n8n webhook error:', bodyText);
            return {
                statusCode: resp.status,
                body: JSON.stringify({
                    error: 'Failed to execute workflow',
                    details: bodyText
                })
            };
        }

        return {
            statusCode: resp.status,
            headers: contentType ? { 'Content-Type': contentType } : {},
            body: bodyText,
        };
    } catch (err) {
        console.error('Webhook proxy error:', err);
        return { statusCode: 500, body: String(err) };
    }
};