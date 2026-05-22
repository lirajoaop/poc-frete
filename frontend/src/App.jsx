import { useEffect, useState } from 'react';
import ProductGrid from './components/ProductGrid.jsx';
import Cart from './components/Cart.jsx';

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products')
      .then(async r => {
        if (!r.ok) throw new Error(`Falha ao carregar produtos (HTTP ${r.status})`);
        return r.json();
      })
      .then(data => setProducts(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function addToCart(product) {
    setCart(curr => {
      const existing = curr.find(i => i.id === product.id);
      if (existing) {
        return curr.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...curr, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(id, delta) {
    setCart(curr =>
      curr
        .map(i => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter(i => i.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart(curr => curr.filter(i => i.id !== id));
  }

  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Importados Lab</h1>
            <p className="text-sm text-neutral-500">Bolsas, roupas e acessórios — POC de frete</p>
          </div>
          <div className="text-sm text-neutral-600">
            {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Produtos</h2>
          {loading && <p className="text-neutral-500">Carregando produtos...</p>}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </p>
          )}
          {!loading && !error && <ProductGrid products={products} onAdd={addToCart} />}
        </section>

        <aside className="lg:col-span-1">
          <Cart items={cart} onUpdate={updateQuantity} onRemove={removeFromCart} />
        </aside>
      </main>
    </div>
  );
}
