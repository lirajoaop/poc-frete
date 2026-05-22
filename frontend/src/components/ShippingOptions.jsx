const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ShippingOptions({ quotes, selectedId, onSelect }) {
  const valid = quotes.filter(q => !q.error && (q.price || q.custom_price));
  const failed = quotes.filter(q => q.error);

  if (valid.length === 0) {
    return (
      <div className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded p-3">
        Nenhuma transportadora pôde cotar este envio.
        {failed[0]?.error && (
          <div className="text-xs text-neutral-500 mt-1">Motivo: {failed[0].error}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Opções de envio</p>
      {valid.map(quote => {
        const price = parseFloat(quote.custom_price ?? quote.price);
        const days = quote.delivery_time;
        const selected = selectedId === quote.id;
        return (
          <label
            key={quote.id}
            className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition ${
              selected
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 hover:border-neutral-400'
            }`}
          >
            <input
              type="radio"
              name="shipping"
              checked={selected}
              onChange={() => onSelect(quote.id)}
              className="accent-neutral-900"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">
                {quote.company?.name ?? 'Transportadora'} · {quote.name}
              </div>
              <div className="text-xs text-neutral-500">
                Entrega em {days} {days === 1 ? 'dia útil' : 'dias úteis'}
              </div>
            </div>
            <div className="text-sm font-semibold">{brl.format(price)}</div>
          </label>
        );
      })}
      {failed.length > 0 && (
        <p className="text-xs text-neutral-500">
          {failed.length} transportadora(s) não puderam cotar este envio.
        </p>
      )}
    </div>
  );
}
