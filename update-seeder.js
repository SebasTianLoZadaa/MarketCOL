const fs = require('fs');
const path = require('path');

// Leer todos los archivos de images
const imagesFolder = path.join(__dirname, 'frontend', 'public', 'images');
const actualFiles = {};

function walk(dir, category = '') {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const catName = file.name;
      actualFiles[catName] = actualFiles[catName] || [];
      walk(filePath, catName);
    } else {
      if (category) {
        actualFiles[category].push(file.name);
      }
    }
  }
}

walk(imagesFolder);

// Leer el seeder actual
const seederPath = path.join(__dirname, 'backend', 'seeders', 'datosCompletos.seeder.js');
let seederContent = fs.readFileSync(seederPath, 'utf8');

// Crear mapeo de categorías
const categoryMap = {
  'DESPENSA': 'DESPENSA',
  'ACEITES Y VINAGRES': 'DESPENSA', // mismo folder
  'AZUCAR Y ENDULZANTES': 'DESPENSA', // mismo folder
  'BEBIDAS': 'BEBIDAS',
  'LACTEOS Y HUEVOS': 'LACTEOS Y HUEVOS',
  'LIMPIEZA Y HOGAR': 'LIMPIEZA Y HOGAR',
  'FRUTAS Y VERDURAS': 'FRUTAS Y VERDURAS'
};

// Función para normalizar un string para búsqueda fuzzy
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Función para encontrar el mejor archivo que coincida
function findBestMatch(imageName, folderCategory) {
  const folderFiles = actualFiles[folderCategory] || [];
  const normalized = normalize(imageName.replace(/\.[^.]+$/, '')); // sin extensión
  
  // Buscar coincidencia exacta (normalizada)
  for (const file of folderFiles) {
    const fileNorm = normalize(file.replace(/\.[^.]+$/, ''));
    if (fileNorm === normalized) {
      return `${folderCategory}/${file}`;
    }
  }
  
  // Buscar coincidencia parcial
  for (const file of folderFiles) {
    const fileNorm = normalize(file.replace(/\.[^.]+$/, ''));
    if (fileNorm.includes(normalized) || normalized.includes(fileNorm)) {
      return `${folderCategory}/${file}`;
    }
  }
  
  // Si no encuentra nada, retornar undefined
  return undefined;
}

// Extraer todas las referencias de imagen del seeder
const imageRegex = /imagen:\s*['"]([^'"]+)['"]/g;
const replacements = {};
let match;

while ((match = imageRegex.exec(seederContent)) !== null) {
  const oldPath = match[1];
  const imageName = path.basename(oldPath);
  const folderName = path.dirname(oldPath);
  
  // Buscar en la categoría correspondiente
  const mappedFolder = categoryMap[folderName] || folderName;
  
  if (actualFiles[mappedFolder]) {
    const newPath = findBestMatch(imageName, mappedFolder);
    if (newPath) {
      replacements[oldPath] = newPath;
    }
  }
}

console.log('Reemplazos encontrados:');
console.log(JSON.stringify(replacements, null, 2));

// Mostrar resumen
const total = Object.keys(replacements).length;
console.log(`\nTotal de rutas a actualizar: ${total}`);
