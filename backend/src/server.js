import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import { products } from './products.js';
import {
  calculateShipping,
  addToCart,
  checkoutOrders,
  generateLabels,
  printLabels
} from './melhor-envio.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const STORE_CEP = (process.env.STORE_POSTAL_CODE || '60160230').replace(/\D/g, '');

app.get('/api/products', (_req, res) => {
  res.json(products);
});

app.post('/api/shipping/calculate', async (req, res) => {
  try {
    const { to_postal_code, items } = req.body ?? {};

    const cleanCep = String(to_postal_code ?? '').replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return res.status(400).json({ error: 'CEP de destino inválido. Use 8 dígitos.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio.' });
    }

    const enriched = enrichItems(items, res);
    if (!enriched) return;

    const quotes = await calculateShipping({
      fromCep: STORE_CEP,
      toCep: cleanCep,
      items: enriched
    });

    res.json(quotes);
  } catch (err) {
    console.error('[shipping/calculate]', err);
    res.status(502).json({ error: err.message });
  }
});

app.post('/api/orders/checkout', async (req, res) => {
  let stage = 'validate';
  try {
    const { service_id, from, to, items } = req.body ?? {};

    if (!service_id) {
      return res.status(400).json({ error: 'service_id obrigatório.' });
    }
    if (!from || !to) {
      return res.status(400).json({ error: 'Dados de remetente e destinatário obrigatórios.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio.' });
    }

    const enriched = enrichItems(items, res);
    if (!enriched) return;

    const insuranceTotal = enriched.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const cartPayload = {
      service: service_id,
      from: cleanAddress(from),
      to: cleanAddress(to),
      products: enriched.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitary_value: item.price
      })),
      volumes: enriched.flatMap(item =>
        Array.from({ length: item.quantity }, () => ({
          height: item.dimensions.height,
          width: item.dimensions.width,
          length: item.dimensions.length,
          weight: item.weight
        }))
      ),
      options: {
        insurance_value: insuranceTotal,
        receipt: false,
        own_hand: false,
        reverse: false,
        non_commercial: true
      }
    };

    stage = 'cart';
    console.log('[orders/checkout] step=cart payload:', JSON.stringify(cartPayload));
    const cart = await addToCart(cartPayload);
    console.log('[orders/checkout] cart response:', JSON.stringify(cart));

    const orderId = cart.id;
    if (!orderId) throw new Error('Cart não retornou order_id.');

    stage = 'checkout';
    console.log('[orders/checkout] step=checkout orderId=', orderId);
    const checkoutResult = await checkoutOrders([orderId]);
    console.log('[orders/checkout] checkout response:', JSON.stringify(checkoutResult));

    stage = 'generate';
    const generateResult = await generateLabels([orderId]);
    console.log('[orders/checkout] generate response:', JSON.stringify(generateResult));

    stage = 'print';
    const printResult = await printLabels([orderId]);
    console.log('[orders/checkout] print response:', JSON.stringify(printResult));

    const generateInfo = generateResult?.[orderId] ?? {};

    res.json({
      order_id: orderId,
      protocol: cart.protocol ?? null,
      tracking: generateInfo.tracking ?? cart.tracking ?? null,
      status: generateInfo.status ?? cart.status ?? null,
      pdf_url: printResult?.url ?? null,
      service: {
        id: service_id,
        name: cart.service?.name ?? null,
        company: cart.service?.company?.name ?? null
      }
    });
  } catch (err) {
    console.error(`[orders/checkout] falhou em stage=${stage}`, err);
    res.status(502).json({
      error: err.message,
      stage,
      details: err.data ?? null
    });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
  console.log(`Origem (loja): CEP ${STORE_CEP}`);
});

function enrichItems(items, res) {
  const enriched = [];
  for (const item of items) {
    const product = products.find(p => p.id === item.id);
    if (!product) {
      res.status(400).json({ error: `Produto não encontrado: ${item.id}` });
      return null;
    }
    const quantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
    enriched.push({ ...product, quantity });
  }
  return enriched;
}

function cleanAddress(addr) {
  return {
    name: addr.name,
    phone: String(addr.phone ?? '').replace(/\D/g, ''),
    email: addr.email,
    document: String(addr.document ?? '').replace(/\D/g, ''),
    address: addr.address,
    complement: addr.complement ?? '',
    number: String(addr.number ?? ''),
    district: addr.district,
    city: addr.city,
    state_abbr: String(addr.state_abbr ?? '').toUpperCase().slice(0, 2),
    country_id: 'BR',
    postal_code: String(addr.postal_code ?? '').replace(/\D/g, ''),
    note: addr.note ?? ''
  };
}
