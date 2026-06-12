/**
 * ============================================
 * UTILIDADES DE EXPORTACIÓN - MarketCOL
 * ============================================
 * Funciones para exportar datos a PDF y Excel
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

/**
 * Configurar fuente para español en jsPDF
 */
const configurarPDF = (doc, titulo) => {
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(titulo, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Generado: ${fecha}`, 14, 28);
  
  return 35;
};

// ==========================================
// EXPORTACIONES PDF
// ==========================================

export const exportarCategoriasAPDF = (categorias) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'REPORTE DE CATEGORÍAS - MarketCOL');
  
  const tableData = categorias.map(cat => [
    cat.id,
    cat.nombre,
    cat.descripcion || '-',
    cat.activo ? 'Activo' : 'Inactivo',
    new Date(cat.createdAt).toLocaleDateString('es-CO')
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setTextColor(40);
  doc.text(`Total de categorías: ${categorias.length}`, 14, finalY);
  doc.text(`Activas: ${categorias.filter(c => c.activo).length}`, 14, finalY + 7);
  doc.text(`Inactivas: ${categorias.filter(c => !c.activo).length}`, 14, finalY + 14);
  
  doc.save(`categorias_${Date.now()}.pdf`);
};

export const exportarSubcategoriasAPDF = (subcategorias, categorias) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'REPORTE DE SUBCATEGORÍAS - MarketCOL');
  
  const tableData = subcategorias.map(sub => {
    const categoria = categorias.find(c => c.id === sub.categoriaId);
    return [
      sub.id,
      sub.nombre,
      categoria?.nombre || '-',
      sub.descripcion || '-',
      sub.activo ? 'Activo' : 'Inactivo'
    ];
  });
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Categoría', 'Descripción', 'Estado']],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Total de subcategorías: ${subcategorias.length}`, 14, finalY);
  doc.text(`Activas: ${subcategorias.filter(s => s.activo).length}`, 14, finalY + 7);
  
  doc.save(`subcategorias_${Date.now()}.pdf`);
};

export const exportarProductosAPDF = (productos) => {
  const doc = new jsPDF('landscape');
  const startY = configurarPDF(doc, 'REPORTE DE PRODUCTOS - MarketCOL');
  
  const tableData = productos.map(prod => [
    prod.id,
    prod.nombre,
    prod.categoria?.nombre || '-',
    prod.subcategoria?.nombre || '-',
    prod.proveedor?.nombre || '-',
    `$${Number(prod.precio).toLocaleString('es-CO')}`,
    prod.stock,
    prod.activo ? 'Activo' : 'Inactivo'
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Categoría', 'Subcategoría', 'Proveedor', 'Precio', 'Stock', 'Estado']],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  const valorTotal = productos.reduce((sum, p) => sum + (Number(p.precio) * p.stock), 0);
  doc.text(`Total de productos: ${productos.length}`, 14, finalY);
  doc.text(`Stock total: ${productos.reduce((sum, p) => sum + p.stock, 0)} unidades`, 14, finalY + 7);
  doc.text(`Valor inventario: $${valorTotal.toLocaleString('es-CO')}`, 14, finalY + 14);
  
  doc.save(`productos_${Date.now()}.pdf`);
};

export const exportarUsuariosAPDF = (usuarios) => {
  const doc = new jsPDF('landscape');
  const startY = configurarPDF(doc, 'REPORTE DE USUARIOS - MarketCOL');
  
  const tableData = usuarios.map(usr => [
    usr.id,
    `${usr.nombre} ${usr.apellido || ''}`,
    usr.email,
    usr.cedula || '-',
    usr.rol,
    usr.telefono || '-',
    usr.activo ? 'Activo' : 'Inactivo'
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Email', 'Cédula', 'Rol', 'Teléfono', 'Estado']],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Total de usuarios: ${usuarios.length}`, 14, finalY);
  doc.text(`Administradores: ${usuarios.filter(u => u.rol === 'administrador').length}`, 14, finalY + 7);
  doc.text(`Auxiliares: ${usuarios.filter(u => u.rol === 'auxiliar').length}`, 14, finalY + 14);
  doc.text(`Clientes: ${usuarios.filter(u => u.rol === 'cliente').length}`, 14, finalY + 21);
  
  doc.save(`usuarios_${Date.now()}.pdf`);
};

export const exportarPedidosAPDF = (pedidos) => {
  const doc = new jsPDF('landscape');
  const startY = configurarPDF(doc, 'REPORTE DE PEDIDOS - MarketCOL');
  
  const getEstadoTexto = (estado) => {
    const textos = {
      'pendiente': 'Pendiente',
      'preparando': 'Preparando',
      'listo': 'Aliste y recoja',
      'entregado': 'Entregado',
      'cancelado': 'Cancelado'
    };
    return textos[estado] || estado;
  };
  
  const tableData = pedidos.map(ped => [
    `#${ped.id}`,
    ped.usuario?.nombre || '-',
    ped.usuario?.email || '-',
    ped.telefono,
    `$${Number(ped.total).toLocaleString('es-CO')}`,
    getEstadoTexto(ped.estado),
    ped.estadoPago === 'confirmado' ? 'Pagado' : 'Pendiente',
    new Date(ped.createdAt).toLocaleDateString('es-CO')
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Cliente', 'Email', 'Teléfono', 'Total', 'Estado', 'Pago', 'Fecha']],
    body: tableData,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  const totalVentas = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
  doc.text(`Total de pedidos: ${pedidos.length}`, 14, finalY);
  doc.text(`Pendientes: ${pedidos.filter(p => p.estado === 'pendiente').length}`, 14, finalY + 7);
  doc.text(`Aliste y recoja: ${pedidos.filter(p => p.estado === 'listo').length}`, 14, finalY + 14);
  doc.text(`Ventas totales: $${totalVentas.toLocaleString('es-CO')}`, 14, finalY + 21);
  
  doc.save(`pedidos_${Date.now()}.pdf`);
};

export const exportarProveedoresAPDF = (proveedores) => {
  const doc = new jsPDF();
  const startY = configurarPDF(doc, 'REPORTE DE PROVEEDORES - MarketCOL');
  
  const tableData = proveedores.map(prov => [
    prov.id,
    prov.nombre,
    prov.contacto || '-',
    prov.telefono || '-',
    prov.email || '-',
    prov.activo ? 'Activo' : 'Inactivo'
  ]);
  
  autoTable(doc, {
    startY,
    head: [['ID', 'Nombre', 'Contacto', 'Teléfono', 'Email', 'Estado']],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [40, 167, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 }
  });
  
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Total de proveedores: ${proveedores.length}`, 14, finalY);
  doc.text(`Activos: ${proveedores.filter(p => p.activo).length}`, 14, finalY + 7);
  doc.text(`Inactivos: ${proveedores.filter(p => !p.activo).length}`, 14, finalY + 14);
  
  doc.save(`proveedores_${Date.now()}.pdf`);
};

// ==========================================
// EXPORTACIONES EXCEL
// ==========================================

export const exportarCategoriasAExcel = async (categorias) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Categorías');
  
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  worksheet.mergeCells('A1:E1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE CATEGORÍAS - MarketCOL';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
  
  worksheet.mergeCells('A2:E2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  const encabezados = ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  let rowIndex = 5;
  categorias.forEach(cat => {
    const row = worksheet.getRow(rowIndex);
    row.values = [cat.id, cat.nombre, cat.descripcion || '', cat.activo ? 'Activo' : 'Inactivo', new Date(cat.createdAt).toLocaleDateString('es-CO')];
    rowIndex++;
  });
  
  worksheet.columns = [{ width: 8 }, { width: 30 }, { width: 50 }, { width: 15 }, { width: 18 }];
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `categorias_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportarSubcategoriasAExcel = async (subcategorias, categorias) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Subcategorías');
  
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  worksheet.mergeCells('A1:F1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE SUBCATEGORÍAS - MarketCOL';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
  
  worksheet.mergeCells('A2:F2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  const encabezados = ['ID', 'Nombre', 'Categoría', 'Descripción', 'Estado', 'Fecha Creación'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  let rowIndex = 5;
  subcategorias.forEach(sub => {
    const categoria = categorias.find(c => c.id === sub.categoriaId);
    const row = worksheet.getRow(rowIndex);
    row.values = [sub.id, sub.nombre, categoria?.nombre || '', sub.descripcion || '', sub.activo ? 'Activo' : 'Inactivo', new Date(sub.createdAt).toLocaleDateString('es-CO')];
    rowIndex++;
  });
  
  worksheet.columns = [{ width: 8 }, { width: 30 }, { width: 25 }, { width: 45 }, { width: 15 }, { width: 18 }];
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `subcategorias_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportarProductosAExcel = async (productos) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Productos');
  
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  worksheet.mergeCells('A1:I1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE PRODUCTOS - MarketCOL';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
  
  worksheet.mergeCells('A2:I2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  const encabezados = ['ID', 'Nombre', 'Categoría', 'Subcategoría', 'Proveedor', 'Precio', 'Stock', 'Valor Inventario', 'Estado'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  let rowIndex = 5;
  productos.forEach(prod => {
    const valorInv = Number(prod.precio) * prod.stock;
    const row = worksheet.getRow(rowIndex);
    row.values = [prod.id, prod.nombre, prod.categoria?.nombre || '', prod.subcategoria?.nombre || '', prod.proveedor?.nombre || '', Number(prod.precio), prod.stock, valorInv, prod.activo ? 'Activo' : 'Inactivo'];
    row.getCell(6).numFmt = '$#,##0';
    row.getCell(8).numFmt = '$#,##0';
    rowIndex++;
  });
  
  worksheet.columns = [{ width: 8 }, { width: 35 }, { width: 18 }, { width: 18 }, { width: 20 }, { width: 15 }, { width: 10 }, { width: 18 }, { width: 15 }];
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productos_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportarUsuariosAExcel = async (usuarios) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Usuarios');
  
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  worksheet.mergeCells('A1:H1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE USUARIOS - MarketCOL';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
  
  worksheet.mergeCells('A2:H2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  const encabezados = ['ID', 'Nombre', 'Apellido', 'Email', 'Cédula', 'Rol', 'Teléfono', 'Estado'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  let rowIndex = 5;
  usuarios.forEach(usr => {
    const row = worksheet.getRow(rowIndex);
    row.values = [usr.id, usr.nombre, usr.apellido || '', usr.email, usr.cedula || '-', usr.rol, usr.telefono || '', usr.activo ? 'Activo' : 'Inactivo'];
    rowIndex++;
  });
  
  worksheet.columns = [{ width: 8 }, { width: 20 }, { width: 20 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 12 }];
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `usuarios_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportarPedidosAExcel = async (pedidos) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pedidos');
  
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  worksheet.mergeCells('A1:I1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE PEDIDOS - MarketCOL';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
  
  worksheet.mergeCells('A2:I2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  const getEstadoTexto = (estado) => {
    const textos = { 'pendiente': 'Pendiente', 'preparando': 'Preparando', 'listo': 'Aliste y recoja', 'entregado': 'Entregado', 'cancelado': 'Cancelado' };
    return textos[estado] || estado;
  };
  
  const encabezados = ['ID', 'Cliente', 'Email', 'Teléfono', 'Total', 'Estado', 'Pago', 'Modalidad', 'Fecha'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  let rowIndex = 5;
  pedidos.forEach(ped => {
    const row = worksheet.getRow(rowIndex);
    row.values = [
      ped.id,
      ped.usuario?.nombre || '',
      ped.usuario?.email || '',
      ped.telefono,
      Number(ped.total),
      getEstadoTexto(ped.estado),
      ped.estadoPago === 'confirmado' ? 'Pagado' : 'Pendiente',
      ped.modalidadEntrega || 'recoger',
      new Date(ped.createdAt).toLocaleDateString('es-CO')
    ];
    row.getCell(5).numFmt = '$#,##0';
    rowIndex++;
  });
  
  worksheet.columns = [{ width: 8 }, { width: 25 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 18 }, { width: 12 }, { width: 12 }, { width: 18 }];
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportarProveedoresAExcel = async (proveedores) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Proveedores');
  
  const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  worksheet.mergeCells('A1:G1');
  const tituloCell = worksheet.getCell('A1');
  tituloCell.value = 'REPORTE DE PROVEEDORES - MarketCOL';
  tituloCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  tituloCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;
  
  worksheet.mergeCells('A2:G2');
  const fechaCell = worksheet.getCell('A2');
  fechaCell.value = `Generado: ${fecha}`;
  fechaCell.font = { name: 'Arial', size: 10, italic: true };
  fechaCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(2).height = 20;
  
  const encabezados = ['ID', 'Nombre', 'Contacto', 'Teléfono', 'Email', 'Dirección', 'Estado'];
  const headerRow = worksheet.getRow(4);
  headerRow.values = encabezados;
  headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;
  
  let rowIndex = 5;
  proveedores.forEach(prov => {
    const row = worksheet.getRow(rowIndex);
    row.values = [prov.id, prov.nombre, prov.contacto || '', prov.telefono || '', prov.email || '', prov.direccion || '', prov.activo ? 'Activo' : 'Inactivo'];
    rowIndex++;
  });
  
  worksheet.columns = [{ width: 8 }, { width: 25 }, { width: 25 }, { width: 15 }, { width: 30 }, { width: 40 }, { width: 12 }];
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `proveedores_${Date.now()}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
};