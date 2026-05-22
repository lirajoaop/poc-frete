import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import express from 'express';
import cors from 'cors';
import { products } from './products.js';
import { calculateShipping } from './melhor-envio.js';

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

    const enrichedItems = [];
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return res.status(400).json({ error: `Produto não encontrado: ${item.id}` });
      }
      const quantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
      enrichedItems.push({ ...product, quantity });
    }

    const quotes = await calculateShipping({
      fromCep: STORE_CEP,
      toCep: cleanCep,
      items: enrichedItems
    });

    res.json(quotes);
  } catch (err) {
    console.error('[shipping/calculate]', err);
    res.status(502).json({ error: err.message });
  }
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
  console.log(`Origem (loja): CEP ${STORE_CEP}`);
});
