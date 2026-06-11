const http = require('http');

http.get('http://localhost:5000/api/catalogo/productos', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const productos = json.data && json.data.productos ? json.data.productos : Array.isArray(json) ? json : [];
      console.log('✅ Productos en API:', productos.length);
      if (productos.length > 0) {
        console.log('\n📦 Primeros 5 productos:');
        productos.slice(0, 5).forEach((p, i) => {
          console.log(`\n   ${i+1}. ${p.nombre}`);
          console.log(`      Imagen: ${p.imagen}`);
          console.log(`      Precio: $${p.precio}`);
        });
      }
    } catch(e) {
      console.error('Error parse:', e.message);
    }
    process.exit(0);
  });
}).on('error', (e) => {
  if (e.code === 'ECONNREFUSED') console.log('❌ Backend no está corriendo en puerto 5000');
  else console.error('Error:', e.message);
  process.exit(1);
});
