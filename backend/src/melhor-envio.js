const BASE_URL = process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br';
const USER_AGENT = process.env.MELHOR_ENVIO_USER_AGENT || 'POC Frete (contato@exemplo.com)';

async function meRequest(method, path, body) {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) {
    throw new Error('MELHOR_ENVIO_TOKEN não definido no .env');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': USER_AGENT
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Resposta inválida do Melhor Envio (${response.status}): ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    const raw = data?.message || data?.error || data?.errors || `HTTP ${response.status}`;
    const message = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const err = new Error(`Melhor Envio (${response.status}): ${message}`);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function calculateShipping({ fromCep, toCep, items }) {
  const products = items.map(item => ({
    id: item.id,
    width: item.dimensions.width,
    height: item.dimensions.height,
    length: item.dimensions.length,
    weight: item.weight,
    insurance_value: item.price,
    quantity: item.quantity
  }));

  return meRequest('POST', '/api/v2/me/shipment/calculate', {
    from: { postal_code: fromCep },
    to: { postal_code: toCep },
    products
  });
}

export function addToCart(payload) {
  return meRequest('POST', '/api/v2/me/cart', payload);
}

export function checkoutOrders(orderIds) {
  return meRequest('POST', '/api/v2/me/shipment/checkout', { orders: orderIds });
}

export function generateLabels(orderIds) {
  return meRequest('POST', '/api/v2/me/shipment/generate', { orders: orderIds });
}

export function printLabels(orderIds, mode = 'private') {
  return meRequest('POST', '/api/v2/me/shipment/print', { orders: orderIds, mode });
}
