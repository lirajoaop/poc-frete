const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ProductGrid({ products, onAdd }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {products.map(product => (
        <article
          key={product.id}
          className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col"
        >
          <div className="aspect-square bg-neutral-100 overflow-hidden">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="p-4 flex flex-col flex-1">
            <span className="text-xs uppercase tracking-wider text-neutral-500">
              {product.category}
            </span>
            <h3 className="font-medium mt-1">{product.name}</h3>
            <p className="text-sm text-neutral-600 mt-1 flex-1">{product.description}</p>
            <div className="text-xs text-neutral-500 mt-3">
              {product.dimensions.width}×{product.dimensions.height}×{product.dimensions.length} cm
              {' · '}
              {(product.weight * 1000).toFixed(0)} g
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-semibold">{brl.format(product.price)}</span>
              <button
                onClick={() => onAdd(product)}
                className="px-3 py-1.5 bg-neutral-900 text-white text-sm rounded hover:bg-neutral-700 transition"
              >
                Adicionar
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
