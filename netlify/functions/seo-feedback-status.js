export const handler = async (event) => {
    // Expect GET requests for status checks. The execution id should be the last path segment.
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // Extract execution id from the path (path looks like: /.netlify/functions/seo-feedback-status/<id>)
    const parts = event.path ? event.path.split('/') : [];
    const executionId = parts.length ? parts[parts.length - 1] : null;
    if (!executionId) {
        return { statusCode: 400, body: 'Missing execution id in path' };
    }

    const base = process.env.N8N_STATUS_BASE || process.env.EXTERNAL_STATUS_BASE;
    if (!base) {
        return { statusCode: 500, body: 'N8N_STATUS_BASE or EXTERNAL_STATUS_BASE not configured' };
    }

    const target = `${base.replace(/\/+$/, '')}/${executionId}`;

    try {
        const resp = await fetch(target);
        const contentType = resp.headers.get && resp.headers.get('content-type');
        const text = await resp.text();
        return {
            statusCode: resp.status,
            headers: contentType ? { 'Content-Type': contentType } : {},
            body: text,
        };
    } catch (err) {
        return { statusCode: 500, body: String(err) };
    }
};
