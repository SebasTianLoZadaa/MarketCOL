const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 5000;
const API_PATH = '/api/catalogo/productos';

const request = http.get(
  {
    hostname: API_HOST,
    port: API_PORT,
    path: API_PATH,
    method: 'GET'
  },
  (res) => {
    let data = '';

    res.setEncoding('utf8');

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const json = JSON.parse(data);

        const productos =
          json?.data?.productos ??
          (Array.isArray(json) ? json : []);

        /*
         * La respuesta del servidor se considera
         * información no confiable.
         *
         * No se imprimen directamente en consola
         * valores provenientes de la respuesta.
         */

        if (Array.isArray(productos)) {
          console.log(
            '✅ La API de productos respondió correctamente.'
          );
        } else {
          console.log(
            '⚠️ La API respondió, pero el formato de productos no es válido.'
          );
        }

        process.exit(0);

      } catch (error) {
        console.error(
          '❌ La respuesta de la API no tiene un formato JSON válido.'
        );

        process.exit(1);
      }
    });
  }
);

request.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.log(
      '❌ Backend no está corriendo en el puerto 5000.'
    );
  } else {
    console.error(
      '❌ No fue posible conectar con el backend.'
    );
  }

  process.exit(1);
});