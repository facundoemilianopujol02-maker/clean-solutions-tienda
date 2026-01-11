// google-sheets.js - Conexión con Google Sheets de Clean Solutions
// ID de TU hoja de cálculo
const SHEET_ID_MAIN = "1GAUcFQMLBDyuQQhc79RvPEOrkyXet5dtpsDUkxPnLsY";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

// Función para cargar productos desde Google Sheets
async function cargarProductosDesdeGoogleSheets() {
    console.log('📡 Conectando a Google Sheets...');
    
    try {
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Google Sheets devuelve datos con un prefijo, lo limpiamos
        const jsonData = JSON.parse(text.substring(47).slice(0, -2));
        
        if (!jsonData.table || !jsonData.table.rows) {
            console.warn('⚠️ No hay datos en la hoja o formato incorrecto');
            return [];
        }
        
        const rows = jsonData.table.rows;
        const productos = [];
        
        // La fila 0 son los encabezados, empezamos desde la fila 1
        for (let i = 1; i < rows.length; i++) {
            const celda = rows[i].c;
            
            // Verificar que la fila tenga datos
            if (celda && celda.length >= 6) {
                // Obtener valores de cada columna
                const id = celda[0]?.v || `prod-${Date.now()}-${i}`;
                const nombre = celda[1]?.v || '';
                const precio = celda[2]?.v || '';
                const imagen = celda[3]?.v || '';
                const descripcion = celda[4]?.v || '';
                const caracteristicasTexto = celda[5]?.v || '';
                
                // Solo agregar si tiene nombre (no filas vacías)
                if (nombre.trim() !== '') {
                    // Separar características por "|"
                    const caracteristicas = caracteristicasTexto
                        .split('|')
                        .map(c => c.trim())
                        .filter(c => c !== '');
                    
                    productos.push({
                        id: id,
                        nombre: nombre,
                        precio: precio,
                        imagen: imagen,
                        descripcion: descripcion,
                        caracteristicas: caracteristicas
                    });
                }
            }
        }
        
        console.log(`✅ ${productos.length} productos cargados desde Google Sheets`);
        
        // Guardar en caché local para usar si hay problemas de conexión
        if (productos.length > 0) {
            localStorage.setItem('cleanSolutions_cache', JSON.stringify({
                productos: productos,
                timestamp: Date.now(),
                fuente: 'google_sheets'
            }));
        }
        
        return productos;
        
    } catch (error) {
        console.error('❌ Error cargando desde Google Sheets:', error);
        
        // Intentar usar caché local si existe
        try {
            const cache = localStorage.getItem('cleanSolutions_cache');
            if (cache) {
                const cachedData = JSON.parse(cache);
                // Usar caché si tiene menos de 2 horas
                if (Date.now() - cachedData.timestamp < 7200000) {
                    console.log('🔄 Usando datos en caché');
                    return cachedData.productos;
                }
            }
        } catch (cacheError) {
            console.error('Error al leer caché:', cacheError);
        }
        
        return [];
    }
}

// Exportar para otros archivos
window.GoogleSheetsDB = {
    cargar: cargarProductosDesdeGoogleSheets
};