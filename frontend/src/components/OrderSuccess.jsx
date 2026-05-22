export default function OrderSuccess({ order, onReset }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-5 lg:sticky lg:top-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mb-3 text-xl font-bold">
          ✓
        </div>
        <h2 className="text-lg font-semibold">Etiqueta gerada</h2>
        <p className="text-sm text-neutral-500">
          Pedido criado no sandbox do Melhor Envio
        </p>
      </div>

      <dl className="mt-5 space-y-2 text-sm">
        <Item label="ID do pedido" value={order.order_id} mono />
        {order.protocol && <Item label="Protocolo" value={order.protocol} mono />}
        {order.tracking && <Item label="Rastreamento" value={order.tracking} mono />}
        {order.service?.company && (
          <Item
            label="Transportadora"
            value={`${order.service.company} · ${order.service.name ?? ''}`}
          />
        )}
        {order.status && <Item label="Status" value={order.status} />}
      </dl>

      {order.pdf_url ? (
        <a
          href={order.pdf_url}
          target="_blank"
          rel="noreferrer"
          className="block mt-5 text-center px-4 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-700"
        >
          Abrir etiqueta (PDF)
        </a>
      ) : (
        <p className="mt-5 text-xs text-neutral-500 text-center">
          PDF não disponível — verifique o console do backend.
        </p>
      )}

      <button
        onClick={onReset}
        className="block w-full mt-2 px-4 py-2 border border-neutral-300 rounded text-sm hover:bg-neutral-50"
      >
        Novo pedido
      </button>
    </div>
  );
}

function Item({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-600 shrink-0">{label}</dt>
      <dd className={`text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
