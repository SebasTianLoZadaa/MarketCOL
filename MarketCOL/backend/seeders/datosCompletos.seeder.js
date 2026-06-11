/**
 * ============================================
 * SEEDER COMPLETO - DATOS DE PRUEBA
 * ============================================
 * Script para poblar la base de datos con datos de prueba completos
 * 
 * Crea:
 * - 1 Administrador
 * - 1 Auxiliar
 * - 5 Clientes
 * - 5 Categorías
 * - 15 Subcategorías (3 por categoría)
 * - 75 Productos (5 por subcategoría)
 */

const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');

/**
 * Función principal del seeder
 */
const seedDatosCompletos = async () => {
  try {
    console.log('\n🌱 ========================================');
    console.log('   INICIANDO SEEDER DE DATOS COMPLETOS');
    console.log('========================================\n');

    // ==========================================
    // 1. CREAR USUARIOS
    // ==========================================
    console.log('👥 1. CREANDO USUARIOS...\n');

    // ADMINISTRADOR
    const adminExistente = await Usuario.findOne({ where: { email: 'admin@ecommerce.com' } });
    if (!adminExistente) {
      await Usuario.create({
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@ecommerce.com',
        password: 'admin1234',
        rol: 'administrador',
        telefono: '3001234567',
        direccion: 'SENA - Oficina Principal',
        activo: true
      });
      console.log('✅ Administrador creado');
      console.log('   📧 Usuario: admin@ecommerce.com');
      console.log('   🔑 Password: admin1234\n');
    } else {
      console.log('✅ Administrador ya existe\n');
    }

    // AUXILIAR
    const auxiliarExistente = await Usuario.findOne({ where: { email: 'auxiliar@ecommerce.com' } });
    if (!auxiliarExistente) {
      await Usuario.create({
        nombre: 'Auxiliar',
        apellido: 'Soporte',
        email: 'auxiliar@ecommerce.com',
        password: 'aux123',
        rol: 'auxiliar',
        telefono: '3009876543',
        direccion: 'SENA - Oficina Auxiliar',
        activo: true
      });
      console.log('✅ Auxiliar creado');
      console.log('   📧 Usuario: auxiliar@ecommerce.com');
      console.log('   🔑 Password: aux123\n');
    } else {
      console.log('✅ Auxiliar ya existe\n');
    }

    // CLIENTES (5)
    console.log('👤 Creando 5 clientes...');
    for (let i = 1; i <= 5; i++) {
      const clienteExistente = await Usuario.findOne({ where: { email: `cliente${i}@ecommerce.com` } });
      if (!clienteExistente) {
        await Usuario.create({
          nombre: `Cliente ${i}`,
          apellido: `Apellido ${i}`,
          cedula: `1000000${i}`,
          email: `cliente${i}@ecommerce.com`,
          password: `cliente${i}`,
          rol: 'cliente',
          telefono: `300${1000000 + i}`,
          direccion: `Dirección del Cliente ${i}, Bogotá`,
          activo: true
        });
        console.log(`   ✅ Cliente ${i} - Email: cliente${i}@ecommerce.com - Pass: cliente${i}`);
      }
    }
    
    const usuariosCreados = await Usuario.count();
    console.log(`\n✅ Total: ${usuariosCreados} usuarios en la base de datos\n`);

    // ==========================================
    // 2. CREAR CATEGORÍAS
    // ==========================================
    console.log('📁 2. CREANDO CATEGORÍAS...\n');

    const categoriasExistentes = await Categoria.count();
    
    if (categoriasExistentes > 0) {
      console.log('⚠️  Ya existen categorías en la base de datos.\n');
    } else {
      const categoriasData = [
        {
          nombre: 'Despensa',
          descripcion: 'Productos de primera necesidad y alimentos'
        },
        {
          nombre: 'Lacteos y Huevos',
          descripcion: 'Productos lácteos y huevos frescos'
        },
        {
          nombre: 'Bebidas',
          descripcion: 'Bebidas para el hogar y decoración'
        },
        {
          nombre: 'Limpieza y Hogar',
          descripcion: 'Productos de limpieza y artículos para el hogar'
        },
        {
          nombre: 'Frutas y Verduras',
          descripcion: 'Frutas y verduras frescas'
        }
      ];

      const categorias = [];
      for (const catData of categoriasData) {
        const categoria = await Categoria.create(catData);
        categorias.push(categoria);
        console.log(`   ✅ ${categoria.nombre}`);
      }
      console.log('\n✅ Total: 5 categorías creadas\n');

      // ==========================================
      // 3. CREAR SUBCATEGORÍAS (3 por categoría)
      // ==========================================
      console.log('📂 3. CREANDO SUBCATEGORÍAS...\n');

      const subcategoriasData = {
        'Despensa': [
          { nombre: 'Arroz y granos', descripcion: 'Arroz, frijoles, lentejas y otros granos' },
          { nombre: 'Aceites y vinagres', descripcion: 'Aceites vegetales y vinagres' },
          { nombre: 'Azucar y endulzantes', descripcion: 'Azúcar, miel y otros endulzantes' }
        ],
        'Lacteos y Huevos': [
          { nombre: 'Leches', descripcion: 'Leches frescas y procesadas' },
          { nombre: 'Quesos', descripcion: 'Quesos de diferentes tipos y sabores' },
          { nombre: 'Huevos', descripcion: 'Huevos frescos y orgánicos' }
        ],
        'Bebidas': [
          { nombre: 'Gaseosas', descripcion: 'Bebidas carbonatadas' },
          { nombre: 'Jugos', descripcion: 'Jugos naturales y procesados' },
          { nombre: 'Aguas', descripcion: 'Agua embotellada y mineral' }
        ],
        'Limpieza y Hogar': [
          { nombre: 'Detergentes', descripcion: 'Detergentes para el lavado de ropa' },
          { nombre: 'Jabones', descripcion: 'Jabones para el baño y la limpieza' },
          { nombre: 'Lavaloza', descripcion: 'Productos para la limpieza de utensilios de cocina' }
        ],
        'Frutas y Verduras': [
          { nombre: 'Frutas', descripcion: 'Frutas frescas y secas' },
          { nombre: 'Verduras', descripcion: 'Verduras frescas y procesadas' },
          { nombre: 'Hortalizas', descripcion: 'Hortalizas de temporada' }
        ]
      };

      const subcategorias = [];
      for (const categoria of categorias) {
        console.log(`📁 ${categoria.nombre}:`);
        const subsData = subcategoriasData[categoria.nombre];
        
        for (const subData of subsData) {
          const subcategoria = await Subcategoria.create({
            nombre: subData.nombre,
            descripcion: subData.descripcion,
            categoriaId: categoria.id,
            activo: true
          });
          subcategorias.push(subcategoria);
          console.log(`   ✅ ${subcategoria.nombre}`);
        }
        console.log('');
      }
      console.log('✅ Total: 15 subcategorías creadas\n');

      // ==========================================
      // 4. CREAR PRODUCTOS (5 por subcategoría)
      // ==========================================
      console.log('📦 4. CREANDO PRODUCTOS...\n');

      const productosData = {
        // DESPENSA
        'Arroz y granos': [
          { nombre: 'Arroz Diana 1kg', descripcion: 'Arroz blanco premium', precio: 3500, stock: 100, imagen: 'DESPENSA/ARROZ-DIANA-1KG.webp' },
          { nombre: 'Lentejas 500g', descripcion: 'Lenteja nacional', precio: 2500, stock: 80, imagen: 'DESPENSA/LENTEJAS-500G.webp' },
          { nombre: 'Frijol cargamanto 500g', descripcion: 'Frijol rojo tradicional', precio: 4000, stock: 70, imagen: 'DESPENSA/FRIJOL-CARGAMANTO-500G.webp' },
          { nombre: 'Garbanzos 500g', descripcion: 'Grano seco seleccionado', precio: 3500, stock: 60, imagen: 'DESPENSA/GARBANZO-500G.webp' },
          { nombre: 'Arroz integral 1kg', descripcion: 'Alto en fibra', precio: 4500, stock: 50, imagen: 'DESPENSA/ARROZ-INTEGRAL-1KG.webp' }
        ],

        'Aceites y vinagres': [
          { nombre: 'Aceite Premier 1L', descripcion: 'Aceite vegetal', precio: 9000, stock: 60, imagen: 'DESPENSA/ACEITE-PREMIER-1L.webp' },
          { nombre: 'Aceite de oliva 500ml', descripcion: 'Extra virgen', precio: 18000, stock: 40, imagen: 'DESPENSA/ACEITE-DE-OLIVA-500ML.webp' },
          { nombre: 'Vinagre blanco 1L', descripcion: 'Multiusos', precio: 3000, stock: 70, imagen: 'DESPENSA/VINAGRE-BLANCO-1L.jpg' },
          { nombre: 'Vinagre de manzana 500ml', descripcion: 'Natural', precio: 5000, stock: 50, imagen: 'DESPENSA/VINAGRE-DE-MANZANA-500ML.webp' },
          { nombre: 'Aceite de girasol 1L', descripcion: 'Ligero para cocinar', precio: 8500, stock: 55, imagen: 'DESPENSA/ACEITE-GIRASOL-1L.webp' }
        ],
        'Azucar y endulzantes': [
          { nombre: 'Azúcar Manuelita 1kg', descripcion: 'Azúcar refinada', precio: 3200, stock: 100, imagen: 'DESPENSA/AZUCAR-MANUELITA-1KG.webp' },
          { nombre: 'Panela en bloque', descripcion: 'Natural', precio: 4000, stock: 80, imagen: 'DESPENSA/PANELA-EN-BLOQUE-1KG.webp' },
          { nombre: 'Miel de abejas 500g', descripcion: '100% natural', precio: 12000, stock: 40, imagen: 'DESPENSA/MIEL-DE-ABEJAS-500G.webp' },
          { nombre: 'Stevia 100 sobres', descripcion: 'Endulzante sin calorías', precio: 8000, stock: 35, imagen: 'DESPENSA/STEVIA-100-SOBRES.webp' },
          { nombre: 'Azúcar morena 1kg', descripcion: 'Sin refinar', precio: 3500, stock: 60, imagen: 'DESPENSA/AZUCAR-MORENA-1KG.webp' }
        ],
        // LÁCTEOS
        'Leches': [
          { nombre: 'Leche Alquería 1L', descripcion: 'Entera', precio: 4200, stock: 100, imagen: 'LACTEOS Y HUEVOS/LECHE-ALQUERIA-1L.webp' },
          { nombre: 'Leche deslactosada 1L', descripcion: 'Baja en lactosa', precio: 4800, stock: 80, imagen: 'LACTEOS Y HUEVOS/LECHE-DESLACTOSADA.webp' },
          { nombre: 'Leche en polvo 400g', descripcion: 'Instantánea', precio: 15000, stock: 50, imagen: 'LACTEOS Y HUEVOS/LECHE-EN-POLVO.webp' },
          { nombre: 'Leche de almendras 1L', descripcion: 'Vegetal', precio: 12000, stock: 30, imagen: 'LACTEOS Y HUEVOS/LECHE-DE-ALMENDRAS.webp' },
          { nombre: 'Leche chocolatada 1L', descripcion: 'Sabor chocolate', precio: 5000, stock: 60, imagen: 'LACTEOS Y HUEVOS/LECHE-CHOCOLATADA.png' }
        ],

        'Quesos': [
          { nombre: 'Queso campesino 500g', descripcion: 'Fresco', precio: 9000, stock: 70, imagen: 'LACTEOS Y HUEVOS/QUESO-CAMPESINO.jpg' },
          { nombre: 'Queso mozzarella 400g', descripcion: 'Para pizzas', precio: 11000, stock: 60, imagen: 'LACTEOS Y HUEVOS/QUESO-MOZZARELLA-400G.webp' },
          { nombre: 'Queso doble crema', descripcion: 'Suave', precio: 9500, stock: 65, imagen: 'LACTEOS Y HUEVOS/QUESO-DOBLE-CREMA.jpg' },
          { nombre: 'Queso parmesano 200g', descripcion: 'Madurado', precio: 12000, stock: 40, imagen: 'LACTEOS Y HUEVOS/QUESO-PARMESANO-200G.webp' },
          { nombre: 'Queso tajado 200g', descripcion: 'Para sándwich', precio: 8000, stock: 75, imagen: 'LACTEOS Y HUEVOS/QUESO-TAJADO-200G.webp' }
        ],

        'Huevos': [
          { nombre: 'Huevos AA x30', descripcion: 'Frescos', precio: 15000, stock: 100, imagen: 'LACTEOS Y HUEVOS/HUEVOS-AA_x30.webp' },
          { nombre: 'Huevos A x12', descripcion: 'Medianos', precio: 7000, stock: 90, imagen: 'LACTEOS Y HUEVOS/HUEVOS-A_x12.jpg' },
          { nombre: 'Huevos orgánicos x12', descripcion: 'Gallinas libres', precio: 12000, stock: 40, imagen: 'LACTEOS Y HUEVOS/HUEVOS-ORGANICOS_x12.webp' },
          { nombre: 'Huevos jumbo x30', descripcion: 'Tamaño grande', precio: 18000, stock: 60, imagen: 'LACTEOS Y HUEVOS/HUEVOS-JUMBO_x30.webp' },
          { nombre: 'Huevos económicos x30', descripcion: 'Precio accesible', precio: 13000, stock: 80, imagen: 'LACTEOS Y HUEVOS/HUEVOS-ECONOMICOS_x30.png' }
        ],

        // BEBIDAS
        'Gaseosas': [
          { nombre: 'Coca-Cola 1.5L', descripcion: 'Gaseosa clásica', precio: 6000, stock: 120, imagen: 'BEBIDAS/GASEOSA-COCA-COLA-ORIGINAL-1.5L.webp' },
          { nombre: 'Pepsi 1.5L', descripcion: 'Sabor cola', precio: 5500, stock: 100, imagen: 'BEBIDAS/GASEOSA-PEPSI-ORIGINAL-1.5L.webp' },
          { nombre: 'Colombiana 1.5L', descripcion: 'Sabor tradicional', precio: 5800, stock: 90, imagen: 'BEBIDAS/GASEOSA-COLOMBIANA-1.5L.webp' },
          { nombre: 'Sprite 1.5L', descripcion: 'Limón', precio: 5700, stock: 85, imagen: 'BEBIDAS/GASEOSA-SPRITE-ORIGINAL-1.5L.webp' },
          { nombre: 'Fanta naranja 1.5L', descripcion: 'Sabor naranja', precio: 5600, stock: 80, imagen: 'BEBIDAS/FANTA-NARANJA-1.5L.webp' }
        ],

        'Jugos': [
          { nombre: 'Jugo Hit mango 1L', descripcion: 'Bebida frutal', precio: 3500, stock: 90, imagen: 'BEBIDAS/JUGO-HIT-MANGO-1L.webp' },
          { nombre: 'Jugo del Valle naranja', descripcion: 'Natural', precio: 4000, stock: 85, imagen: 'BEBIDAS/JUGO-DEL-VALLE-NARANJA-1.5L.png' },
          { nombre: 'Jugo en caja 200ml', descripcion: 'Para lonchera', precio: 1200, stock: 150, imagen: 'BEBIDAS/JUGO-EN-CAJA-200ML.webp' },
          { nombre: 'Jugo de mora 1L', descripcion: 'Natural', precio: 5000, stock: 60, imagen: 'BEBIDAS/JUGO-HIT-MORA-1L.webp' },
          { nombre: 'Jugo de guanábana', descripcion: 'Pulpa', precio: 5500, stock: 50, imagen: 'BEBIDAS/jugo-guanabana.jpg' }
        ],

        'Aguas': [
          { nombre: 'Agua Cristal 600ml', descripcion: 'Sin gas', precio: 1500, stock: 200, imagen: 'BEBIDAS/AGUA-CRISTAL-600ML.webp' },
          { nombre: 'Agua con gas 1L', descripcion: 'Carbonatada', precio: 2500, stock: 100, imagen: 'BEBIDAS/AGUA-CON-GAS-1L.webp' },
          { nombre: 'Agua saborizada', descripcion: 'Frutos rojos', precio: 3000, stock: 80, imagen: 'BEBIDAS/AGUA-SABORIZADA.webp' },
          { nombre: 'Agua 5L', descripcion: 'Para hogar', precio: 7000, stock: 60, imagen: 'BEBIDAS/AGUA-5L.webp' },
          { nombre: 'Agua premium 750ml', descripcion: 'Mineral', precio: 4000, stock: 50, imagen: 'BEBIDAS/AGUA-PREMIUM-750ML.webp' }
        ],

        // LIMPIEZA
        'Detergentes': [
          { nombre: 'Ariel 1kg', descripcion: 'Detergente en polvo', precio: 12000, stock: 70, imagen: 'LIMPIEZA Y HOGAR/ARIEL-1KG.webp' },
          { nombre: 'Fab líquido 1L', descripcion: 'Ropa', precio: 10000, stock: 60, imagen: 'LIMPIEZA Y HOGAR/FAB-LIQUIDO-1L.jpg' },
          { nombre: 'Detergente económico', descripcion: 'Uso diario', precio: 8000, stock: 80, imagen: 'LIMPIEZA Y HOGAR/DETERGENTE-ECONOMICO.webp' },
          { nombre: 'Suavizante 1L', descripcion: 'Aroma floral', precio: 7000, stock: 50, imagen: 'LIMPIEZA Y HOGAR/SUAVIZANTE-1L.webp' },
          { nombre: 'Detergente cápsulas', descripcion: 'Alta eficiencia', precio: 15000, stock: 40, imagen: 'LIMPIEZA Y HOGAR/DETERGENTE-CAPSULAS.webp' }
        ],

        'Jabones': [
          { nombre: 'Jabón Dove', descripcion: 'Hidratante', precio: 4000, stock: 100, imagen: 'LIMPIEZA Y HOGAR/JABON-DOVE.webp' },
          { nombre: 'Jabón Protex', descripcion: 'Antibacterial', precio: 3500, stock: 90, imagen: 'LIMPIEZA Y HOGAR/JABON-PROTEX.jpg' },
          { nombre: 'Jabón Rey', descripcion: 'Multiusos', precio: 2500, stock: 120, imagen: 'LIMPIEZA Y HOGAR/JABON-REY.jpg' },
          { nombre: 'Jabón líquido manos', descripcion: '500ml', precio: 6000, stock: 70, imagen: 'LIMPIEZA Y HOGAR/JABON-LIQUIDO-MANOS.webp' },
          { nombre: 'Jabón infantil', descripcion: 'Suave', precio: 4500, stock: 60, imagen: 'LIMPIEZA Y HOGAR/JABON-LIQUIDO-BEBES.avif' }
        ],

        'Lavaloza': [
          { nombre: 'Axion limón', descripcion: 'Lavaplatos', precio: 5000, stock: 80, imagen: 'LIMPIEZA Y HOGAR/AXION-LIMON.webp' },
          { nombre: 'Lavaloza líquido 1L', descripcion: 'Desengrasante', precio: 6000, stock: 70, imagen: 'LIMPIEZA Y HOGAR/LAVALOZA-ANTIBACTERIAL.webp'},
          { nombre: 'Esponjas x3', descripcion: 'Multiuso', precio: 3000, stock: 100, imagen: 'LIMPIEZA Y HOGAR/ESPONJAS_x3.webp' },
          { nombre: 'Lavaloza antibacterial', descripcion: 'Extra limpieza', precio: 6500, stock: 60, imagen: 'LIMPIEZA Y HOGAR/LAVALOZA-ANTIBACTERIAL.webp' },
          { nombre: 'Cepillo cocina', descripcion: 'Plástico', precio: 4000, stock: 50 , imagen: 'LIMPIEZA Y HOGAR/CEPILLO-COCINA.jpg' }
        ],
              // FRUTAS Y VERDURAS
        'Frutas': [
          { nombre: 'Banano 1kg', descripcion: 'Fresco', precio: 2500, stock: 120, imagen: 'FRUTAS Y VERDURAS/BANANO-1KG.jpg' },
          { nombre: 'Manzana roja 1kg', descripcion: 'Importada', precio: 6000, stock: 90, imagen: 'FRUTAS Y VERDURAS/MANZANA-ROJA-1KG.jpg' },
          { nombre: 'Naranja 1kg', descripcion: 'Jugosa', precio: 3000, stock: 100, imagen: 'FRUTAS Y VERDURAS/NARANJA-1K.webp' },
          { nombre: 'Piña entera', descripcion: 'Dulce', precio: 5000, stock: 70 , imagen: 'FRUTAS Y VERDURAS/PIÑA-ENTERA.webp'},
          { nombre: 'Uva 500g', descripcion: 'Sin semillas', precio: 7000, stock: 60 , imagen: 'FRUTAS Y VERDURAS/UVA-500G.webp'}
        ],

        'Verduras': [
          { nombre: 'Papa 1kg', descripcion: 'Pastusa', precio: 2000, stock: 150, imagen: 'FRUTAS Y VERDURAS/PAPA-PASTUSA-1KG.jpg' },
          { nombre: 'Tomate 1kg', descripcion: 'Chonto', precio: 3500, stock: 120, imagen: 'FRUTAS Y VERDURAS/TOMATE-1KG.jpg' },
          { nombre: 'Cebolla cabezona', descripcion: '1kg', precio: 3000, stock: 100, imagen: 'FRUTAS Y VERDURAS/CEBOLLA-CABEZONA.jpg' },
          { nombre: 'Zanahoria 1kg', descripcion: 'Fresca', precio: 2500, stock: 110, imagen: 'FRUTAS Y VERDURAS/ZANAHORIA-1KG.webp' },
          { nombre: 'Lechuga', descripcion: 'Unidad', precio: 2000, stock: 80, imagen: 'FRUTAS Y VERDURAS/LECHUGA.jpg' }
        ],

        'Hortalizas': [
          { nombre: 'Brócoli', descripcion: 'Fresco', precio: 4000, stock: 70, imagen: 'FRUTAS Y VERDURAS/BROCOLI.webp' },
          { nombre: 'Coliflor', descripcion: 'Unidad', precio: 4500, stock: 60, imagen: 'FRUTAS Y VERDURAS/COLIFLOR.webp' },
          { nombre: 'Espinaca', descripcion: 'Bolsa', precio: 3000, stock: 80, imagen: 'FRUTAS Y VERDURAS/ESPINACA.webp' },
          { nombre: 'Pepino cohombro', descripcion: 'Unidad', precio: 2000, stock: 90, imagen: 'FRUTAS Y VERDURAS/PEPINO-COHOMBRO.webp' },
          { nombre: 'Ajo 250g', descripcion: 'Natural', precio: 3500, stock: 100, imagen: 'FRUTAS Y VERDURAS/AJO-250-GR.jpg' }
        ]
      };

      let totalProductos = 0;

      for (const subcategoria of subcategorias) {
        const productos = productosData[subcategoria.nombre];
        
        if (productos) {
          console.log(`📦 ${subcategoria.nombre} (${subcategoria.categoria?.nombre || 'Sin categoría'}):`);
          
          for (const prodData of productos) {
            const nombreImagen = prodData.imagen || null;
            
            await Producto.create({
              nombre: prodData.nombre,
              descripcion: prodData.descripcion,
              precio: prodData.precio,
              stock: prodData.stock,
              categoriaId: subcategoria.categoriaId,
              subcategoriaId: subcategoria.id,
              imagen: nombreImagen, // Imagen definida manualmente en el seeder
              activo: true
            });
            console.log(`   ✅ ${prodData.nombre} - $${prodData.precio.toLocaleString()}`);
            totalProductos++;
          }
          console.log('');
        }
      }
      
      console.log(`✅ Total: ${totalProductos} productos creados\n`);
    }

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n🎉 ========================================');
    console.log('   SEEDER COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');

    const totalUsuarios = await Usuario.count();
    const totalCategorias = await Categoria.count();
    const totalSubcategorias = await Subcategoria.count();
    const totalProductos = await Producto.count();

    console.log('📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${totalUsuarios}`);
    console.log(`   📁 Categorías: ${totalCategorias}`);
    console.log(`   📂 Subcategorías: ${totalSubcategorias}`);
    console.log(`   📦 Productos: ${totalProductos}\n`);

    console.log('🔑 CREDENCIALES DE ACCESO:\n');
    console.log('   👨‍💼 ADMINISTRADOR');
    console.log('      Email: admin@ecommerce.com');
    console.log('      Password: admin1234\n');
    console.log('   👤 AUXILIAR');
    console.log('      Email: auxiliar@ecommerce.com');
    console.log('      Password: aux123\n');
    console.log('   🛍️  CLIENTES (5)');
    console.log('      Email: cliente1@ecommerce.com - Password: cliente1');
    console.log('      Email: cliente2@ecommerce.com - Password: cliente2');
    console.log('      Email: cliente3@ecommerce.com - Password: cliente3');
    console.log('      Email: cliente4@ecommerce.com - Password: cliente4');
    console.log('      Email: cliente5@ecommerce.com - Password: cliente5\n');

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en el seeder:', error.message);
    console.error(error);
    throw error;
  }
};

module.exports = { seedDatosCompletos };
