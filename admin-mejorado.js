// admin-mejorado.js - Sistema admin MEJORADO y SIMPLE

document.addEventListener('DOMContentLoaded', function() {
    // ========== CONFIGURACIÓN ==========
    const CLAVE_ADMIN = "ragnar610";
    const ADMIN_KEY = 'cleanSolutionsAdmin';
    const SHEET_ID = "1GAUcFQMLBDyuQQhc79RvPEOrkyXet5dtpsDUkxPnLsY";
    
    // ========== ELEMENTOS DEL DOM ==========
    const btnAdminAcceso = document.getElementById('btnAdminAcceso');
    const btnAdminPanel = document.getElementById('btnAdminPanel');
    const btnCerrarSesion = document.getElementById('btnCerrarSesionAdmin');
    const modalAccesoAdmin = document.getElementById('modalAccesoAdmin');
    const modalGestionProductos = document.getElementById('modalGestionProductos');
    const formAccesoAdmin = document.getElementById('formAccesoAdmin');
    const formProducto = document.getElementById('formProducto');
    const listaProductosAdmin = document.getElementById('listaProductosAdmin');
    const contadorProductos = document.getElementById('contadorProductos');
    const inputPrecio = document.getElementById('adminPrecio');
    
    // ========== ESTADO ==========
    let esAdmin = false;
    let productoEditando = null;
    let imagenActual = null;
    
    // ========== INICIALIZACIÓN ==========
    function inicializar() {
        console.log('⚙️ Sistema administrativo inicializando...');
        verificarSesionAdmin();
        configurarEventos();
        crearBotonReset();
        crearBotonesImportExport();
        configurarInputPrecio();
        configurarDragDrop();
        agregarBotonesSincronizacionSimple();
        console.log('✅ Sistema administrativo listo');
    }
    
    // ========== SISTEMA SIMPLE DE GOOGLE SHEETS ==========
    function agregarBotonesSincronizacionSimple() {
        const adminSection = document.querySelector('.admin-section');
        if (!adminSection) return;
        
        const syncHTML = `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
                <h4 style="margin: 0 0 10px 0; color: #0D47A1;">🔄 Google Sheets Sincronización</h4>
                <p style="margin: 0 0 15px 0; color: #333; font-size: 14px;">
                    <strong>Para publicar productos para TODOS los clientes:</strong><br>
                    1. Agrega productos aquí<br>
                    2. Copia los datos<br>
                    3. Pega en Google Sheets
                </p>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button id="btnCopiarUltimo" style="padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        📋 Copiar último producto
                    </button>
                    <button id="btnAbrirSheets" style="padding: 10px 15px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        📊 Abrir Google Sheets
                    </button>
                    <button id="btnVerInstrucciones" style="padding: 10px 15px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        📖 Ver instrucciones
                    </button>
                </div>
                <div id="instruccionesSheets" style="display: none; margin-top: 15px; padding: 10px; background: white; border-radius: 5px; border: 1px solid #ddd;">
                    <h5>📝 Cómo agregar a Google Sheets:</h5>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                        <li>Abre Google Sheets (botón arriba)</li>
                        <li>Ve a la última fila vacía</li>
                        <li>Pega los datos copiados</li>
                        <li>Asegúrate que cada dato esté en su columna correcta</li>
                        <li>¡Listo! Los clientes verán el producto</li>
                    </ol>
                </div>
            </div>
        `;
        
        adminSection.insertAdjacentHTML('afterbegin', syncHTML);
        
        // Eventos
        document.getElementById('btnCopiarUltimo').addEventListener('click', copiarUltimoProducto);
        document.getElementById('btnAbrirSheets').addEventListener('click', () => {
            window.open(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`, '_blank');
        });
        document.getElementById('btnVerInstrucciones').addEventListener('click', () => {
            const inst = document.getElementById('instruccionesSheets');
            inst.style.display = inst.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    function copiarUltimoProducto() {
        const productos = obtenerProductos();
        if (productos.length === 0) {
            mostrarNotificacion('❌ No hay productos para copiar', 'error');
            return;
        }
        
        const ultimoProducto = productos[productos.length - 1];
        const texto = `${ultimoProducto.id}\t${ultimoProducto.nombre}\t${ultimoProducto.precio}\t${ultimoProducto.imagen}\t${ultimoProducto.descripcion}\t${ultimoProducto.caracteristicas.join('|')}`;
        
        navigator.clipboard.writeText(texto)
            .then(() => {
                mostrarNotificacion('✅ Producto copiado. Pégalo en Google Sheets', 'success');
            })
            .catch(() => {
                prompt('Copia este texto:', texto);
            });
    }
    
    // ========== FUNCIONES BÁSICAS ==========
    function verificarSesionAdmin() {
        if (localStorage.getItem(ADMIN_KEY) === 'true') {
            activarModoAdmin();
        }
    }
    
    function activarModoAdmin() {
        esAdmin = true;
        if (btnAdminAcceso) btnAdminAcceso.style.display = 'none';
        if (btnAdminPanel) btnAdminPanel.style.display = 'inline-block';
        if (btnCerrarSesion) btnCerrarSesion.style.display = 'inline-block';
        console.log('✅ Modo administrador activado');
    }
    
    function configurarEventos() {
        // ... (tus eventos actuales) ...
    }
    
    // ========== GESTIÓN DE PRODUCTOS ==========
    async function guardarProducto(e) {
        e.preventDefault();
        
        // Obtener valores del formulario
        const nombre = document.getElementById('adminNombre').value.trim();
        let precio = document.getElementById('adminPrecio').value.trim();
        const imagenInput = document.getElementById('adminImagen').value.trim();
        const descripcion = document.getElementById('adminDescripcion').value.trim();
        const caracteristicasTexto = document.getElementById('adminCaracteristicas').value;
        const productoId = document.getElementById('productoId').value;
        
        // Validaciones básicas
        if (!nombre || !precio || !imagenInput || !descripcion) {
            mostrarNotificacion('❌ Complete todos los campos obligatorios', 'error');
            return;
        }
        
        // Formatear precio
        if (!precio.startsWith('$')) {
            precio = '$' + precio.replace('$', '');
        }
        
        const soloNumeros = precio.substring(1).replace(/[^\d]/g, '');
        if (soloNumeros.length === 0) {
            mostrarNotificacion('❌ Ingrese un precio válido', 'error');
            return;
        }
        
        const caracteristicas = caracteristicasTexto
            .split('\n')
            .map(c => c.trim())
            .filter(c => c !== '');
        
        // Determinar imagen final
        let imagenFinal = imagenInput;
        if (productoId && productoEditando && imagenActual) {
            imagenFinal = imagenActual.nombre;
        }
        
        // Preparar objeto producto
        const producto = {
            nombre,
            precio,
            imagen: imagenFinal,
            descripcion,
            caracteristicas
        };
        
        // Guardar en sistema
        if (productoId && productoEditando !== null) {
            // Editar
            const exito = actualizarProductoDB(productoId, producto);
            if (exito) {
                mostrarNotificacion('✅ Producto actualizado', 'success');
                // Mostrar opción para Google Sheets
                mostrarOpcionGoogleSheets(productoId, producto);
            }
        } else {
            // Nuevo
            producto.id = 'prod-' + Date.now();
            const resultado = agregarProductoDB(producto);
            if (resultado) {
                mostrarNotificacion('✅ Producto agregado', 'success');
                // Mostrar opción para Google Sheets
                mostrarOpcionGoogleSheets(producto.id, producto);
            }
        }
        
        // Limpiar y actualizar
        resetFormProducto();
        cargarListaProductosAdmin();
        
        if (typeof window.cargarProductos === 'function') {
            window.cargarProductos();
        }
    }
    
    function mostrarOpcionGoogleSheets(id, producto) {
        const confirmar = confirm(`🎉 Producto guardado localmente.\n\n¿Quieres COPIAR los datos para agregar a Google Sheets?\n\n(Así aparecerá para TODOS los clientes)`);
        
        if (confirmar) {
            const texto = `${id}\t${producto.nombre}\t${producto.precio}\t${producto.imagen}\t${producto.descripcion}\t${producto.caracteristicas.join('|')}`;
            
            navigator.clipboard.writeText(texto)
                .then(() => {
                    const abrir = confirm('✅ Datos copiados.\n\n¿Abrir Google Sheets para pegarlos?');
                    if (abrir) {
                        window.open(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`, '_blank');
                    }
                })
                .catch(() => {
                    prompt('Copia este texto y pégalo en Google Sheets:', texto);
                });
        }
    }
    
    // ========== FUNCIONES DE NOTIFICACIÓN ==========
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // ... (tu código de notificaciones) ...
    }
    
    // ========== INICIAR ==========
    inicializar();
});