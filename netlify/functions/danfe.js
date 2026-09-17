// netlify/functions/danfe.js
// Proxy para POST https://consultadanfe.com/api/v1/danfe
// Repassa o multipart/form-data recebido do frontend (arquivos XML) direto
// para a API, sem reconstruir o form — apenas encaminha o corpo bruto.

const API_URL = 'https://consultadanfe.com/api/v1/danfe';

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'X-Error-Code, X-XML-Recovery, X-Envelope-Origem, X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Método não permitido' }),
    };
  }

  try {
    const contentType = event.headers['content-type'] || event.headers['Content-Type'];
    const bodyBuffer = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : Buffer.from(event.body, 'utf8');

    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: bodyBuffer,
    });

    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const errorCode = upstream.headers.get('X-Error-Code');
    const xmlRecovery = upstream.headers.get('X-XML-Recovery');
    const envelopeOrigem = upstream.headers.get('X-Envelope-Origem');
    const rlLimit = upstream.headers.get('X-RateLimit-Limit');
    const rlRemaining = upstream.headers.get('X-RateLimit-Remaining');
    const retryAfter = upstream.headers.get('Retry-After');

    return {
      statusCode: upstream.status,
      headers: {
        ...corsHeaders,
        'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
        ...(errorCode ? { 'X-Error-Code': errorCode } : {}),
        ...(xmlRecovery ? { 'X-XML-Recovery': xmlRecovery } : {}),
        ...(envelopeOrigem ? { 'X-Envelope-Origem': envelopeOrigem } : {}),
        ...(rlLimit ? { 'X-RateLimit-Limit': rlLimit } : {}),
        ...(rlRemaining ? { 'X-RateLimit-Remaining': rlRemaining } : {}),
        ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
      },
      body: buffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Falha ao contatar a API: ${err.message}` }),
    };
  }
};
