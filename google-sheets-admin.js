// google-sheets-admin.js - Sistema avanzado para administrador

// ========== CONFIGURACIÓN ==========
const SHEET_ID = "1GAUcFQMLBDyuQQhc79RvPEOrkyXet5dtpsDUkxPnLsY";
const API_KEY = "AIzaSyB3nD4G3KjXp6Vv7Xq9Z8YrA1bC2dE3fG4H"; // Clave de API de Google
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwFgqfOzE-5V0V_fAV38U6EW_0CgHi5nqaFWTFKwwsL_scnvKC72JYsVpz85E2iX90K/exec";

// URLs para diferentes operaciones
const SHEET_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/productos?key=${API_KEY}`;
const APPEND_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/productos:append?valueInputOption=USER_ENTERED&key=${API_KEY}`;
const UPDATE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/productos`; // Se completa con rango

// ========== FUNCIONES PRINCIPALES ==========

// 1. LEER productos desde Google Sheets
async function leerProductosDesdeSheets() {
    console.log('📖 Leyendo productos desde Google Sheets...');
    
    try {
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error ${response.status}: ${error}`);
        }
        
        const data = await response.json();
        
        if (!data.values || data.values.length < 2) {
            console.log('📭 No hay productos en la hoja');
            return [];
        }
        
        // Convertir filas a objetos (omitir encabezados)
        const productos = [];
        for (let i = 1; i < data.values.length; i++) {
            const fila = data.values[i];
            if (fila.length >= 6) {
                productos.push({
                    id: fila[0] || `row-${i + 1}`,
                    nombre: fila[1] || '',
                    precio: fila[2] || '',
                    imagen: fila[3] || '',
                    descripcion: fila[4] || '',
                    caracteristicas: fila[5] ? fila[5].split('|').filter(c => c.trim()) : [],
                    fila: i + 1 // Para actualizaciones
                });
            }
        }
        
        console.log(`✅ ${productos.length} productos leídos desde Sheets`);
        return productos;
        
    } catch (error) {
        console.error('❌ Error leyendo de Google Sheets:', error.message);
        mostrarNotificacionAdmin('❌ Error conectando con Google Sheets', 'error');
        return [];
    }
}

// 2. AGREGAR producto a Google Sheets
async function agregarProductoASheets(producto) {
    console.log('➕ Agregando producto a Google Sheets:', producto.nombre);
    
    try {
        const valores = [
            producto.id,
            producto.nombre,
            producto.precio,
            producto.imagen,
            producto.descripcion,
            producto.caracteristicas.join('|')
        ];
        
        const body = {
            values: [valores]
        };
        
        const response = await fetch(APPEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error ${response.status}: ${error}`);
        }
        
        const data = await response.json();
        console.log('✅ Producto agregado a Google Sheets');
        mostrarNotificacionAdmin('✅ Producto publicado para todos los clientes', 'success');
        
        return {
            success: true,
            fila: data.updates.updatedRange
        };
        
    } catch (error) {
        console.error('❌ Error agregando a Google Sheets:', error.message);
        mostrarNotificacionAdmin('❌ No se pudo publicar en Google Sheets', 'error');
        
        // Guardar en cola de espera
        guardarEnColaEspera(producto);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// 3. ACTUALIZAR producto en Google Sheets
async function actualizarProductoEnSheets(fila, producto) {
    console.log('✏️ Actualizando producto en fila', fila);
    
    try {
        const rango = `productos!A${fila}:F${fila}`;
        const url = `${UPDATE_URL}/${rango}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        
        const valores = [
            producto.id,
            producto.nombre,
            producto.precio,
            producto.imagen,
            producto.descripcion,
            producto.caracteristicas.join('|')
        ];
        
        const body = {
            values: [valores]
        };
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error ${response.status}: ${error}`);
        }
        
        console.log('✅ Producto actualizado en Google Sheets');
        mostrarNotificacionAdmin('✅ Cambios publicados para todos los clientes', 'success');
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error actualizando en Google Sheets:', error);
        mostrarNotificacionAdmin('❌ No se pudo actualizar en Google Sheets', 'error');
        return { success: false, error: error.message };
    }
}

// 4. ELIMINAR producto de Google Sheets
async function eliminarProductoDeSheets(fila) {
    console.log('🗑️ Eliminando producto en fila', fila);
    
    try {
        // Para eliminar necesitamos Google Apps Script
        // Por ahora, marcamos como eliminado
        const rango = `productos!A${fila}:F${fila}`;
        const url = `${UPDATE_URL}/${rango}?valueInputOption=USER_ENTERED&key=${API_KEY}`;
        
        const valores = [
            `ELIMINADO_${Date.now()}`,
            'PRODUCTO ELIMINADO',
            '',
            '',
            'Este producto ha sido eliminado',
            ''
        ];
        
        const body = {
            values: [valores]
        };
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }
        
        console.log('✅ Producto marcado como eliminado en Google Sheets');
        mostrarNotificacionAdmin('✅ Producto eliminado para todos los clientes', 'success');
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error eliminando de Google Sheets:', error);
        mostrarNotificacionAdmin('❌ No se pudo eliminar de Google Sheets', 'error');
        return { success: false };
    }
}

// ========== FUNCIONES DE UTILIDAD ==========

// Guardar productos en cola de espera (si falla la conexión)
function guardarEnColaEspera(producto) {
    try {
        const cola = JSON.parse(localStorage.getItem('cleanSolutions_cola_espera') || '[]');
        cola.push({
            ...producto,
            timestamp: Date.now(),
            accion: 'agregar'
        });
        localStorage.setItem('cleanSolutions_cola_espera', JSON.stringify(cola));
        
        mostrarNotificacionAdmin('📝 Producto guardado localmente. Se intentará subir más tarde.', 'info');
        
    } catch (error) {
        console.error('Error guardando en cola:', error);
    }
}

// Procesar cola de espera
async function procesarColaEspera() {
    try {
        const cola = JSON.parse(localStorage.getItem('cleanSolutions_cola_espera') || '[]');
        
        if (cola.length === 0) return;
        
        console.log(`🔄 Procesando cola de espera: ${cola.length} productos`);
        
        for (const item of cola) {
            if (item.accion === 'agregar') {
                await agregarProductoASheets(item);
            }
        }
        
        // Limpiar cola procesada
        localStorage.setItem('cleanSolutions_cola_espera', '[]');
        
    } catch (error) {
        console.error('Error procesando cola:', error);
    }
}

// Notificaciones para admin
function mostrarNotificacionAdmin(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-admin';
    
    const icono = tipo === 'success' ? '✅' : 
                 tipo === 'error' ? '❌' : 
                 tipo === 'info' ? 'ℹ️' : '🔔';
    
    const color = tipo === 'success' ? '#4CAF50' : 
                 tipo === 'error' ? '#f44336' : 
                 tipo === 'info' ? '#2196F3' : '#FF9800';
    
    notificacion.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 12px 20px;
        background: ${color};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
        border-left: 5px solid ${tipo === 'success' ? '#2E7D32' : 
                             tipo === 'error' ? '#C62828' : 
                             tipo === 'info' ? '#1565C0' : '#EF6C00'};
    `;
    
    notificacion.innerHTML = `
        <span style="font-size: 18px;">${icono}</span>
        <span>${mensaje}</span>
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.remove();
            }
        }, 300);
    }, 5000);
}

// Verificar conexión con Google Sheets
async function verificarConexionSheets() {
    try {
        const response = await fetch(SHEET_URL);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// ========== API PÚBLICA ==========
window.GoogleSheetsAdmin = {
    // Operaciones CRUD
    leer: leerProductosDesdeSheets,
    agregar: agregarProductoASheets,
    actualizar: actualizarProductoEnSheets,
    eliminar: eliminarProductoDeSheets,
    
    // Utilidades
    verificarConexion: verificarConexionSheets,
    procesarCola: procesarColaEspera,
    mostrarNotificacion: mostrarNotificacionAdmin,
    
    // Configuración
    config: {
        sheetId: SHEET_ID,
        estaConectado: false
    }
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async function() {
    setTimeout(async () => {
        // Verificar conexión
        const conectado = await verificarConexionSheets();
        window.GoogleSheetsAdmin.config.estaConectado = conectado;
        
        if (conectado) {
            console.log('✅ Conectado a Google Sheets API');
            
            // Procesar cola de espera si hay
            await procesarColaEspera();
            
            // Mostrar indicador de conexión
            const indicador = document.createElement('div');
            indicador.id = 'sheets-status-indicator';
            indicador.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: #4CAF50;
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 8px;
                z-index: 9998;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            `;
            indicador.innerHTML = `🌐 Conectado a Google Sheets`;
            document.body.appendChild(indicador);
            
        } else {
            console.warn('⚠️ No hay conexión a Google Sheets API');
            mostrarNotificacionAdmin('⚠️ Modo offline: Los cambios se guardarán localmente', 'info');
        }
    }, 1000);
});