export const handler = async (event) => {
    // Proxy POST requests to the external webhook (n8n or your proxy server).
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const target = process.env.N8N_WEBHOOK_URL || process.env.EXTERNAL_WEBHOOK_URL;
    if (!target) {
        return { statusCode: 500, body: 'N8N_WEBHOOK_URL or EXTERNAL_WEBHOOK_URL not configured' };
    }

    try {
        const resp = await fetch(target, {
            method: 'POST',
            headers: {
                'Content-Type': event.headers['content-type'] || event.headers['Content-Type'] || 'application/json',
            },
            body: event.body,
        });

        const contentType = resp.headers.get && resp.headers.get('content-type');
        const bodyText = await resp.text();

        return {
            statusCode: resp.status,
            headers: contentType ? { 'Content-Type': contentType } : {},
            body: bodyText,
        };
    } catch (err) {
        return { statusCode: 500, body: String(err) };
    }
};
