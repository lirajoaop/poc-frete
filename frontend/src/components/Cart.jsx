import { useState } from 'react';
import ShippingOptions from './ShippingOptions.jsx';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export default function Cart({ items, onUpdate, onRemove }) {
  const [cep, setCep] = useState('');
  const [quotes, setQuotes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cepDigits = cep.replace(/\D/g, '');
  const canCalculate = cepDigits.length === 8 && items.length > 0 && !loading;

  async function handleCalculate() {
    setLoading(true);
    setError(null);
    setQuotes(null);
    setSelectedQuoteId(null);
    try {
      const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_postal_code: cepDigits,
          items: items.map(i => ({ id: i.id, quantity: i.quantity }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao calcular frete');
      setQuotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedQuote = quotes?.find(q => q.id === selectedQuoteId);
  const shippingPrice = selectedQuote
    ? parseFloat(selectedQuote.custom_price ?? selectedQuote.price ?? 0)
    : 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold mb-4">Carrinho</h2>

      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Adicione produtos para calcular o frete.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-neutral-100 mb-4">
            {items.map(item => (
              <li key={item.id} className="py-3 flex items-start gap-3">
                <img
                  src={item.image}
                  alt=""
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.name}</div>
                  <div className="text-xs text-neutral-500">
                    {brl.format(item.price * item.quantity)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => onUpdate(item.id, -1)}
                      className="w-6 h-6 border border-neutral-300 rounded text-sm leading-none hover:bg-neutral-50"
                      aria-label="Diminuir"
                    >
                      −
                    </button>
                    <span className="text-sm w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdate(item.id, +1)}
                      className="w-6 h-6 border border-neutral-300 rounded text-sm leading-none hover:bg-neutral-50"
                      aria-label="Aumentar"
                    >
                      +
                    </button>
                    <button
                      onClick={() => onRemove(item.id)}
                      className="text-xs text-neutral-500 hover:text-red-600 ml-auto"
                    >
                      remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex justify-between text-sm border-t border-neutral-100 pt-3 mb-4">
            <span>Subtotal</span>
            <span className="font-medium">{brl.format(subtotal)}</span>
          </div>

          <div className="space-y-2 mb-3">
            <label htmlFor="cep" className="block text-sm font-medium">
              CEP de entrega
            </label>
            <div className="flex gap-2">
              <input
                id="cep"
                type="text"
                inputMode="numeric"
                value={cep}
                onChange={e => setCep(formatCep(e.target.value))}
                placeholder="00000-000"
                className="flex-1 px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                onClick={handleCalculate}
                disabled={!canCalculate}
                className="px-4 py-2 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-700 transition disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                {loading ? 'Calculando...' : 'Calcular'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2 mb-3">
              {error}
            </div>
          )}

          {quotes && (
            <ShippingOptions
              quotes={quotes}
              selectedId={selectedQuoteId}
              onSelect={setSelectedQuoteId}
            />
          )}

          {selectedQuote && (
            <div className="border-t border-neutral-200 pt-3 mt-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{brl.format(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frete</span>
                <span>{brl.format(shippingPrice)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t border-neutral-100">
                <span>Total</span>
                <span>{brl.format(subtotal + shippingPrice)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
