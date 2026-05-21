// poc-frete.js
const TOKEN = process.env.MELHOR_ENVIO_TOKEN;

async function cotarFrete() {
   const response = await fetch(
      'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate',
      {
         method: 'POST',
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`,
            'User-Agent': 'POC Bolsas (joaopedroababa132@gmail.com)'
         },
         body: JSON.stringify({
            from: { postal_code: '60160230' },  // Fortaleza/CE
            to:   { postal_code: '01310100' },  // São Paulo/SP (Av. Paulista)
            products: [
               {
                  id: 'bolsa-001',
                  width: 30,        // cm
                  height: 20,       // cm
                  length: 10,       // cm
                  weight: 0.6,      // kg (600g)
                  insurance_value: 250.00,  // R$
                  quantity: 1
               }
            ]
         })
      }
   );

   const data = await response.json();
   console.log('Status HTTP:', response.status);
   console.log('\nResposta:\n', JSON.stringify(data, null, 2));
}

cotarFrete().catch(err => console.error('Erro:', err));