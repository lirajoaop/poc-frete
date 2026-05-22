import { useEffect, useState } from 'react';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const senderDefaults = {
  name: 'Importados Lab',
  document: '11144477735',
  phone: '85999999999',
  email: 'contato@importadoslab.test',
  address: 'Av. Dom Luís',
  number: '1233',
  complement: '',
  district: 'Aldeota',
  city: 'Fortaleza',
  state_abbr: 'CE',
  postal_code: '60160230'
};

const receiverBase = {
  name: 'João Cliente Teste',
  document: '11144477735',
  phone: '11988888888',
  email: 'cliente@teste.com',
  address: '',
  number: '100',
  complement: '',
  district: '',
  city: '',
  state_abbr: ''
};

function formatCep(value) {
  const digits = String(value).replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

async function lookupCep(cepDigits) {
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
    if (!r.ok) return null;
    const data = await r.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

export default function CheckoutModal({
  onClose,
  onComplete,
  selectedQuote,
  cartItems,
  destinationCep,
  subtotal
}) {
  const [sender, setSender] = useState(senderDefaults);
  const [receiver, setReceiver] = useState({
    ...receiverBase,
    postal_code: formatCep(destinationCep || '')
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cep = receiver.postal_code.replace(/\D/g, '');
    if (cep.length !== 8) return;
    let cancelled = false;
    lookupCep(cep).then(data => {
      if (cancelled || !data) return;
      setReceiver(prev => ({
        ...prev,
        address: data.logradouro || prev.address,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state_abbr: data.uf || prev.state_abbr
      }));
    });
    return () => { cancelled = true; };
  }, [receiver.postal_code]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedQuote.id,
          from: sender,
          to: receiver,
          items: cartItems.map(i => ({ id: i.id, quantity: i.quantity }))
        })
      });
      const data = await response.json();
      if (!response.ok) {
        const stage = data.stage ? ` (etapa: ${data.stage})` : '';
        throw new Error(`${data.error || 'Erro ao gerar etiqueta'}${stage}`);
      }
      onComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const shippingPrice = parseFloat(selectedQuote.custom_price ?? selectedQuote.price);
  const total = subtotal + shippingPrice;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-auto">
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-semibold">Finalizar pedido</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-neutral-500 hover:text-neutral-900 text-xl leading-none disabled:opacity-50"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-200 rounded p-3">
            Dados pré-preenchidos para teste no sandbox. CPFs/telefones aqui não geram cobranças reais —
            cada checkout debita do saldo do sandbox e gera uma etiqueta de teste.
          </p>

          <AddressForm title="Remetente" value={sender} onChange={setSender} />
          <AddressForm title="Destinatário" value={receiver} onChange={setReceiver} />

          <div className="border-t border-neutral-200 pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-600">Frete escolhido</span>
              <span>
                {selectedQuote.company?.name} · {selectedQuote.name} · {brl.format(shippingPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Subtotal</span>
              <span>{brl.format(subtotal)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-neutral-100">
              <span>Total</span>
              <span>{brl.format(total)}</span>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 whitespace-pre-wrap">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-neutral-300 rounded text-sm hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-700 text-white text-sm rounded hover:bg-emerald-800 disabled:bg-neutral-300"
            >
              {loading ? 'Processando...' : 'Confirmar e gerar etiqueta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddressForm({ title, value, onChange }) {
  function update(field, v) {
    onChange({ ...value, [field]: v });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-neutral-700">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Nome" value={value.name} onChange={v => update('name', v)} className="sm:col-span-2" />
        <Field
          label="CPF"
          value={value.document}
          onChange={v => update('document', v.replace(/\D/g, '').slice(0, 11))}
        />
        <Field
          label="Telefone"
          value={value.phone}
          onChange={v => update('phone', v.replace(/\D/g, '').slice(0, 11))}
        />
        <Field label="E-mail" type="email" value={value.email} onChange={v => update('email', v)} className="sm:col-span-2" />
        <Field
          label="CEP"
          value={value.postal_code}
          onChange={v => update('postal_code', formatCep(v))}
        />
        <Field label="Endereço" value={value.address} onChange={v => update('address', v)} />
        <Field label="Número" value={value.number} onChange={v => update('number', v)} />
        <Field label="Complemento" value={value.complement} onChange={v => update('complement', v)} optional />
        <Field label="Bairro" value={value.district} onChange={v => update('district', v)} />
        <Field label="Cidade" value={value.city} onChange={v => update('city', v)} />
        <Field
          label="UF"
          value={value.state_abbr}
          onChange={v => update('state_abbr', v.toUpperCase().slice(0, 2))}
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', optional = false, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs text-neutral-600">
        {label}{optional && <span className="text-neutral-400"> (opcional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={!optional}
        className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
      />
    </label>
  );
}
