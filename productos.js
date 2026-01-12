// productos.js - Sistema HÍBRIDO Google Sheets + localStorage COMPLETO

// ========== CONFIGURACIÓN ==========
const PRODUCTOS_POR_DEFECTO = [
    {
    },
    {
    }
];

// Claves para localStorage
const PRODUCTOS_KEY = 'cleanSolutionsProductos_v1';
const IMAGENES_KEY = 'cleanSolutionsImages';
const CACHE_KEY = 'cleanSolutions_cache';
const LOCAL_PRODUCTOS_KEY = 'cleanSolutions_productos_locales';

// ========== FUNCIONES PARA IMÁGENES ==========
function guardarImagenEnStorage(nombre, dataURL) {
    try {
        const imagenesGuardadas = JSON.parse(localStorage.getItem(IMAGENES_KEY) || '{}');
        imagenesGuardadas[nombre] = dataURL;
        localStorage.setItem(IMAGENES_KEY, JSON.stringify(imagenesGuardadas));
        return true;
    } catch (error) {
        console.error('Error al guardar imagen:', error);
        return false;
    }
}

function cargarImagenDesdeStorage(nombre) {
    try {
        const imagenesGuardadas = JSON.parse(localStorage.getItem(IMAGENES_KEY) || '{}');
        return imagenesGuardadas[nombre] || null;
    } catch (error) {
        console.error('Error al cargar imagen:', error);
        return null;
    }
}

function obtenerTodasImagenes() {
    try {
        return JSON.parse(localStorage.getItem(IMAGENES_KEY) || '{}');
    } catch (error) {
        console.error('Error obteniendo imágenes:', error);
        return {};
    }
}

// ========== FUNCIONES PARA PRODUCTOS ==========
async function obtenerTodosProductos() {
    let productosFinales = [];
    let fuente = 'desconocida';
    
    // 1. INTENTAR DESDE GOOGLE SHEETS
    if (window.GoogleSheetsDB && typeof window.GoogleSheetsDB.cargar === 'function') {
        try {
            const productosSheets = await window.GoogleSheetsDB.cargar();
            
            if (productosSheets && productosSheets.length > 0) {
                console.log(`📊 ${productosSheets.length} productos desde Google Sheets`);
                productosFinales = [...productosSheets];
                fuente = 'google_sheets';
            }
        } catch (error) {
            console.log('⚠️ Falló Google Sheets:', error.message);
        }
    }
    
    // 2. PRODUCTOS LOCALES DEL ADMIN (prioridad si hay)
    const productosLocales = obtenerProductosLocales();
    if (productosLocales.length > 0) {
        console.log(`🏠 ${productosLocales.length} productos locales del admin`);
        
        if (productosFinales.length === 0) {
            // Si no hay productos de Sheets, usar locales
            productosFinales = [...productosLocales];
            fuente = 'local_storage';
        } else {
            // Combinar: evitar duplicados por ID
            const idsExistentes = new Set(productosFinales.map(p => p.id));
            const productosNuevos = productosLocales.filter(p => !idsExistentes.has(p.id));
            productosFinales = [...productosFinales, ...productosNuevos];
            fuente = 'combinado';
        }
    }
    
    // 3. PRODUCTOS EN CACHÉ ANTIGUA (backward compatibility)
    if (productosFinales.length === 0) {
        try {
            const cache = localStorage.getItem(CACHE_KEY);
            if (cache) {
                const cachedData = JSON.parse(cache);
                if (cachedData.productos && cachedData.productos.length > 0) {
                    productosFinales = [...cachedData.productos];
                    fuente = 'cache_antigua';
                    console.log(`🔄 ${productosFinales.length} productos desde caché antigua`);
                }
            }
        } catch (cacheError) {
            console.error('Error leyendo caché antigua:', cacheError);
        }
    }
    
    // 4. SISTEMA ANTIGUO DE PRODUCTOS (backward compatibility)
    if (productosFinales.length === 0) {
        try {
            const productosViejos = localStorage.getItem(PRODUCTOS_KEY);
            if (productosViejos) {
                productosFinales = JSON.parse(productosViejos);
                fuente = 'sistema_antiguo';
                console.log(`📦 ${productosFinales.length} productos del sistema antiguo`);
            }
        } catch (error) {
            console.error('Error leyendo productos antiguos:', error);
        }
    }
    
    // 5. PRODUCTOS POR DEFECTO (último recurso)
    if (productosFinales.length === 0) {
        console.log('🔧 Usando productos por defecto');
        productosFinales = [...PRODUCTOS_POR_DEFECTO];
        fuente = 'por_defecto';
    }
    
    console.log(`✅ Total: ${productosFinales.length} productos (fuente: ${fuente})`);
    return productosFinales;
}

// ========== FUNCIONES PARA PRODUCTOS LOCALES ==========
function obtenerProductosLocales() {
    try {
        const data = localStorage.getItem(LOCAL_PRODUCTOS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error leyendo productos locales:', error);
        return [];
    }
}

function guardarProductosLocales(productos) {
    try {
        localStorage.setItem(LOCAL_PRODUCTOS_KEY, JSON.stringify(productos));
        console.log(`💾 ${productos.length} productos guardados localmente`);
        return true;
    } catch (error) {
        console.error('Error guardando productos locales:', error);
        return false;
    }
}

// ========== SISTEMA DE EXPORTACIÓN/IMPORTACIÓN ==========
function exportarProductosCompletos() {
    return obtenerTodosProductos().then(productos => {
        const imagenes = obtenerTodasImagenes();
        
        return {
            fecha: new Date().toISOString(),
            version: '2.0',
            productos: productos,
            imagenes: imagenes,
            metadata: {
                totalProductos: productos.length,
                totalImagenes: Object.keys(imagenes).length,
                exportadoPor: 'Clean Solutions v2',
                fuente: 'sistema_hibrido'
            }
        };
    });
}

async function importarProductosCompletos(datos) {
    if (!datos.productos || !Array.isArray(datos.productos)) {
        throw new Error('Formato de datos inválido');
    }
    
    // Guardar productos
    guardarProductosLocales(datos.productos);
    
    // Guardar imágenes si existen
    if (datos.imagenes && typeof datos.imagenes === 'object') {
        localStorage.setItem(IMAGENES_KEY, JSON.stringify(datos.imagenes));
    }
    
    console.log(`📥 ${datos.productos.length} productos importados`);
    return datos.productos;
}

// ========== API PÚBLICA ==========
window.ProductosDB = {
    // Obtener todos los productos
    obtenerTodos: obtenerTodosProductos,
    
    // Funciones CRUD para admin
    agregar: async function(nuevoProducto) {
        const productos = await obtenerTodosProductos();
        productos.push(nuevoProducto);
        guardarProductosLocales(productos);
        return nuevoProducto;
    },
    
    actualizar: async function(id, datosActualizados) {
        const productos = await obtenerTodosProductos();
        const index = productos.findIndex(p => p.id === id);
        
        if (index !== -1) {
            productos[index] = { ...productos[index], ...datosActualizados };
            guardarProductosLocales(productos);
            return true;
        }
        return false;
    },
    
    eliminar: async function(id) {
        const productos = await obtenerTodosProductos();
        const index = productos.findIndex(p => p.id === id);
        
        if (index !== -1) {
            productos.splice(index, 1);
            guardarProductosLocales(productos);
            return true;
        }
        return false;
    },
    
    // Guardar cambios
    guardar: async function() {
        const productos = await obtenerTodosProductos();
        guardarProductosLocales(productos);
        return productos;
    },
    
    // Resetear
    resetear: function() {
        guardarProductosLocales(PRODUCTOS_POR_DEFECTO);
        return PRODUCTOS_POR_DEFECTO;
    },
    
    // Funciones de imágenes
    guardarImagen: guardarImagenEnStorage,
    cargarImagen: cargarImagenDesdeStorage,
    obtenerImagenes: obtenerTodasImagenes,
    
    // Exportar/Importar
    exportarCompleto: exportarProductosCompletos,
    importarCompleto: importarProductosCompletos,
    
    // Backward compatibility
    obtenerProductosViejos: function() {
        try {
            const data = localStorage.getItem(PRODUCTOS_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            return [];
        }
    }
};

// ========== INICIALIZACIÓN AUTOMÁTICA ==========
// Migrar datos antiguos al nuevo sistema (si existe)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(async () => {
        try {
            // Verificar si hay datos en el sistema antiguo
            const productosViejos = window.ProductosDB.obtenerProductosViejos();
            const productosLocales = obtenerProductosLocales();
            
            if (productosViejos.length > 0 && productosLocales.length === 0) {
                console.log('🔄 Migrando datos antiguos al nuevo sistema...');
                guardarProductosLocales(productosViejos);
                console.log(`✅ ${productosViejos.length} productos migrados`);
            }
            
            // Cargar productos para verificar
            const productos = await obtenerTodosProductos();
            console.log('🎯 Sistema de productos inicializado correctamente');
            
        } catch (error) {
            console.error('Error en inicialización:', error);
        }
    }, 1000);
});