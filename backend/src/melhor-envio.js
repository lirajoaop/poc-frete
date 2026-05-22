const BASE_URL = process.env.MELHOR_ENVIO_BASE_URL || 'https://sandbox.melhorenvio.com.br';
const USER_AGENT = process.env.MELHOR_ENVIO_USER_AGENT || 'POC Frete (contato@exemplo.com)';

export async function calculateShipping({ fromCep, toCep, items }) {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) {
    throw new Error('MELHOR_ENVIO_TOKEN não definido no .env');
  }

  const products = items.map(item => ({
    id: item.id,
    width: item.dimensions.width,
    height: item.dimensions.height,
    length: item.dimensions.length,
    weight: item.weight,
    insurance_value: item.price,
    quantity: item.quantity
  }));

  const response = await fetch(`${BASE_URL}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'User-Agent': USER_AGENT
    },
    body: JSON.stringify({
      from: { postal_code: fromCep },
      to: { postal_code: toCep },
      products
    })
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do Melhor Envio (${response.status}): ${text.slice(0, 300)}`);
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `HTTP ${response.status}`;
    throw new Error(`Melhor Envio: ${message}`);
  }

  return data;
}
