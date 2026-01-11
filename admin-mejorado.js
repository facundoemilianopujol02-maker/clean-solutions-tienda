// admin-mejorado.js - Sistema admin COMPLETO y FUNCIONAL

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
    
    // ========== VERIFICAR SESIÓN ==========
    function verificarSesionAdmin() {
        const sesionAdmin = localStorage.getItem(ADMIN_KEY);
        if (sesionAdmin === 'true') {
            activarModoAdmin();
        }
    }
    
    function activarModoAdmin() {
        esAdmin = true;
        
        // Actualizar botones
        if (btnAdminAcceso) btnAdminAcceso.style.display = 'none';
        if (btnAdminPanel) btnAdminPanel.style.display = 'inline-block';
        if (btnCerrarSesion) btnCerrarSesion.style.display = 'inline-block';
        
        console.log('✅ Modo administrador activado');
        mostrarNotificacion('👑 Sesión administrativa activa', 'success');
    }
    
    function desactivarModoAdmin() {
        esAdmin = false;
        localStorage.removeItem(ADMIN_KEY);
        
        // Restaurar botones
        if (btnAdminAcceso) btnAdminAcceso.style.display = 'inline-block';
        if (btnAdminPanel) btnAdminPanel.style.display = 'none';
        if (btnCerrarSesion) btnCerrarSesion.style.display = 'none';
        
        cerrarModalGestion();
        mostrarNotificacion('🔒 Sesión administrativa cerrada', 'info');
        console.log('🚪 Sesión administrativa cerrada');
    }
    
    // ========== CONFIGURACIÓN DE EVENTOS ==========
    function configurarEventos() {
        console.log('🔗 Configurando eventos...');
        
        // Acceso admin
        if (btnAdminAcceso) {
            btnAdminAcceso.addEventListener('click', () => {
                console.log('🖱️ Clic en Acceso Admin');
                modalAccesoAdmin.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                document.getElementById('claveAdmin').focus();
            });
        }
        
        // Formulario de acceso
        if (formAccesoAdmin) {
            formAccesoAdmin.addEventListener('submit', (e) => {
                e.preventDefault();
                verificarClave();
            });
        }
        
        // Panel admin
        if (btnAdminPanel) {
            btnAdminPanel.addEventListener('click', () => {
                if (esAdmin) {
                    console.log('🖱️ Abriendo panel de gestión');
                    abrirModalGestion();
                }
            });
        }
        
        // Cerrar sesión
        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', () => {
                if (confirm('¿Estás seguro de cerrar la sesión administrativa?')) {
                    desactivarModoAdmin();
                }
            });
        }
        
        // Cerrar modales
        document.querySelector('.cerrar-acceso-admin')?.addEventListener('click', () => {
            modalAccesoAdmin.style.display = 'none';
            document.body.style.overflow = 'auto';
            formAccesoAdmin.reset();
        });
        
        document.querySelector('.cerrar-gestion-productos')?.addEventListener('click', cerrarModalGestion);
        
        // Formulario producto
        if (formProducto) {
            formProducto.addEventListener('submit', guardarProducto);
        }
        
        // Cancelar edición
        document.getElementById('btnCancelarEdicion')?.addEventListener('click', () => {
            resetFormProducto();
        });
    }
    
    function verificarClave() {
        const claveIngresada = document.getElementById('claveAdmin').value;
        
        if (claveIngresada === CLAVE_ADMIN) {
            localStorage.setItem(ADMIN_KEY, 'true');
            activarModoAdmin();
            modalAccesoAdmin.style.display = 'none';
            document.body.style.overflow = 'auto';
            formAccesoAdmin.reset();
            
            mostrarNotificacion('✅ Acceso administrativo concedido', 'success');
            
            // Abrir panel automáticamente
            setTimeout(() => {
                if (btnAdminPanel) {
                    btnAdminPanel.click();
                }
            }, 800);
            
            console.log('🔓 Acceso administrativo exitoso');
        } else {
            mostrarNotificacion('❌ Clave incorrecta', 'error');
            document.getElementById('claveAdmin').value = '';
            document.getElementById('claveAdmin').focus();
            console.log('🔒 Intento de acceso fallido');
        }
    }
    
    // ========== BOTÓN RESET ==========
    function crearBotonReset() {
        // Verificar si ya existe
        if (!document.getElementById('resetContainer')) {
            const btnResetContainer = document.createElement('div');
            btnResetContainer.id = 'resetContainer';
            btnResetContainer.style.cssText = `
                position: fixed;
                bottom: 80px;
                right: 20px;
                z-index: 9999;
                display: none;
            `;
            
            btnResetContainer.innerHTML = `
                <button id="btnResetProductos" 
                        style="padding: 10px 15px; background: linear-gradient(135deg, #ff9800, #ff5722); 
                               color: white; border: none; border-radius: 8px; font-size: 13px; 
                               cursor: pointer; box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                               font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    🔄 Resetear Productos
                </button>
            `;
            
            document.body.appendChild(btnResetContainer);
            
            document.getElementById('btnResetProductos').addEventListener('click', () => {
                if (confirm('⚠️ ¿Resetear todos los productos a los valores por defecto?\n\n' +
                           'Se perderán TODOS los productos agregados manualmente.\n' +
                           'Esta acción NO se puede deshacer.')) {
                    if (window.ProductosDB && window.ProductosDB.resetear) {
                        window.ProductosDB.resetear();
                        cargarListaProductosAdmin();
                        if (typeof window.cargarProductos === 'function') {
                            window.cargarProductos();
                        }
                        mostrarNotificacion('✅ Productos reseteados a valores por defecto', 'success');
                        console.log('🔄 Productos reseteados');
                    }
                }
            });
        }
        
        // Mostrar si es admin
        if (esAdmin) {
            document.getElementById('resetContainer').style.display = 'block';
        }
    }
    
    // ========== IMPORT/EXPORT ==========
    function crearBotonesImportExport() {
        // Verificar si ya existen
        if (!document.getElementById('importExportContainer')) {
            const container = document.createElement('div');
            container.id = 'importExportContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 140px;
                right: 20px;
                z-index: 9999;
                display: none;
                flex-direction: column;
                gap: 10px;
            `;
            
            container.innerHTML = `
                <button id="btnExportarProductos" 
                        style="padding: 10px 15px; background: linear-gradient(135deg, #4CAF50, #2E7D32); 
                               color: white; border: none; border-radius: 8px; font-size: 13px; 
                               cursor: pointer; box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                               font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    📤 Exportar Productos
                </button>
                <button id="btnImportarProductos" 
                        style="padding: 10px 15px; background: linear-gradient(135deg, #2196F3, #1565C0); 
                               color: white; border: none; border-radius: 8px; font-size: 13px; 
                               cursor: pointer; box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                               font-weight: bold; display: flex; align-items: center; gap: 8px;">
                    📥 Importar Productos
                </button>
                <input type="file" id="fileImportInput" accept=".json" style="display: none;">
            `;
            
            document.body.appendChild(container);
            
            // Configurar eventos
            document.getElementById('btnExportarProductos').addEventListener('click', exportarProductos);
            document.getElementById('btnImportarProductos').addEventListener('click', () => {
                document.getElementById('fileImportInput').click();
            });
            
            document.getElementById('fileImportInput').addEventListener('change', importarProductosDesdeArchivo);
        }
        
        // Mostrar si es admin
        if (esAdmin) {
            document.getElementById('importExportContainer').style.display = 'flex';
        }
    }
    
    function exportarProductos() {
        try {
            // Obtener productos
            const productos = obtenerProductos();
            
            // Obtener imágenes de localStorage
            const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
            
            // Crear objeto de exportación
            const datosExportacion = {
                fecha: new Date().toISOString(),
                version: '1.0',
                productos: productos,
                imagenes: imagenesGuardadas,
                metadata: {
                    totalProductos: productos.length,
                    totalImagenes: Object.keys(imagenesGuardadas).length,
                    exportadoPor: 'Sistema Clean Solutions'
                }
            };
            
            // Convertir a JSON
            const jsonString = JSON.stringify(datosExportacion, null, 2);
            
            // Crear archivo para descargar
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clean-solutions-productos-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            mostrarNotificacion('✅ Productos exportados exitosamente', 'success');
            console.log('📤 Productos exportados:', productos.length);
            
        } catch (error) {
            console.error('Error al exportar productos:', error);
            mostrarNotificacion('❌ Error al exportar productos', 'error');
        }
    }
    
    function importarProductosDesdeArchivo(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const datos = JSON.parse(e.target.result);
                
                // Validar archivo
                if (!datos.productos || !Array.isArray(datos.productos)) {
                    mostrarNotificacion('❌ Archivo inválido: No contiene productos', 'error');
                    return;
                }
                
                if (!confirm(`⚠️ ¿IMPORTAR PRODUCTOS?\n\n` +
                            `Productos: ${datos.productos.length}\n` +
                            `Imágenes: ${datos.imagenes ? Object.keys(datos.imagenes).length : 0}\n\n` +
                            `Esta acción REEMPLAZARÁ todos los productos actuales.`)) {
                    return;
                }
                
                // Importar productos
                if (window.ProductosDB && window.ProductosDB.resetear) {
                    // Resetear productos actuales
                    window.ProductosDB.resetear();
                    
                    // Agregar productos importados
                    datos.productos.forEach(producto => {
                        window.ProductosDB.agregar(producto);
                    });
                }
                
                // Importar imágenes
                if (datos.imagenes && typeof datos.imagenes === 'object') {
                    localStorage.setItem('cleanSolutionsImages', JSON.stringify(datos.imagenes));
                }
                
                // Guardar cambios
                if (window.ProductosDB && window.ProductosDB.guardar) {
                    window.ProductosDB.guardar();
                }
                
                // Actualizar interfaz
                cargarListaProductosAdmin();
                if (typeof window.cargarProductos === 'function') {
                    window.cargarProductos();
                }
                
                mostrarNotificacion(`✅ ${datos.productos.length} productos importados exitosamente`, 'success');
                console.log('📥 Productos importados:', datos.productos.length);
                
            } catch (error) {
                console.error('Error al importar productos:', error);
                mostrarNotificacion('❌ Error al importar: Archivo JSON inválido', 'error');
            }
        };
        
        reader.readAsText(file);
        // Limpiar input
        event.target.value = '';
    }
    
    // ========== CONFIGURACIÓN INPUT PRECIO ==========
    function configurarInputPrecio() {
        if (!inputPrecio) return;
        
        inputPrecio.placeholder = '$8.000';
        
        inputPrecio.addEventListener('input', function() {
            let valor = this.value.replace('$', '');
            
            // Solo números
            valor = valor.replace(/[^\d]/g, '');
            
            if (valor) {
                const numero = parseInt(valor, 10);
                if (!isNaN(numero)) {
                    this.value = '$' + numero.toLocaleString('es-AR');
                }
            } else {
                this.value = '$';
            }
        });
    }
    
    // ========== DRAG & DROP ==========
    function configurarDragDrop() {
        const dragDropArea = document.getElementById('dragDropArea');
        const fileInput = document.getElementById('adminImagenFile');
        
        if (!dragDropArea || !fileInput) return;
        
        // Configuración básica
        dragDropArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imagePreview = document.getElementById('imagePreview');
                    const previewContainer = document.getElementById('previewContainer');
                    const previewName = document.getElementById('previewName');
                    const dragDropContent = document.querySelector('.drag-drop-content');
                    
                    if (imagePreview && previewContainer) {
                        imagePreview.src = e.target.result;
                        previewName.textContent = file.name;
                        previewContainer.style.display = 'flex';
                        if (dragDropContent) {
                            dragDropContent.style.display = 'none';
                        }
                        
                        document.getElementById('adminImagen').value = file.name;
                        imagenActual = {
                            nombre: file.name,
                            dataURL: e.target.result
                        };
                        
                        // Guardar imagen
                        guardarImagenEnStorage(file.name, e.target.result);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Botón eliminar preview
        document.getElementById('removePreview')?.addEventListener('click', function(e) {
            e.stopPropagation();
            resetImagePreview();
        });
    }
    
    function resetImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        const previewContainer = document.getElementById('previewContainer');
        const dragDropContent = document.querySelector('.drag-drop-content');
        
        if (previewContainer) previewContainer.style.display = 'none';
        if (dragDropContent) dragDropContent.style.display = 'flex';
        document.getElementById('adminImagen').value = '';
        document.getElementById('adminImagenFile').value = '';
        imagenActual = null;
    }
    
    function guardarImagenEnStorage(nombre, dataURL) {
        try {
            const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
            imagenesGuardadas[nombre] = dataURL;
            localStorage.setItem('cleanSolutionsImages', JSON.stringify(imagenesGuardadas));
            console.log(`💾 Imagen guardada: ${nombre}`);
        } catch (error) {
            console.error('Error al guardar imagen:', error);
        }
    }
    
    // ========== GOOGLE SHEETS SIMPLE ==========
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
    
    // ========== GESTIÓN DE PRODUCTOS ==========
    function abrirModalGestion() {
        if (!esAdmin) {
            mostrarNotificacion('❌ No tienes permisos administrativos', 'error');
            return;
        }
        
        cargarListaProductosAdmin();
        modalGestionProductos.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        console.log('📋 Panel de gestión abierto');
    }
    
    function cerrarModalGestion() {
        modalGestionProductos.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetFormProducto();
    }
    
    function cargarListaProductosAdmin() {
        if (!listaProductosAdmin) return;
        
        const productosActuales = obtenerProductos();
        let html = '';
        
        if (productosActuales.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 20px;">🛒</div>
                    <h4 style="margin-bottom: 10px;">No hay productos registrados</h4>
                    <p>Usa el formulario arriba para agregar tu primer producto.</p>
                </div>
            `;
        } else {
            productosActuales.forEach((producto, index) => {
                // Cargar imagen desde storage
                let imagenSrc = producto.imagen;
                try {
                    const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
                    if (imagenesGuardadas[producto.imagen]) {
                        imagenSrc = imagenesGuardadas[producto.imagen];
                    }
                } catch (error) {
                    console.error('Error cargando imagen:', error);
                }
                
                html += `
                    <div class="producto-admin-item" 
                         style="padding: 15px; border: 1px solid #e0e0e0; display: flex; justify-content: space-between; 
                                align-items: center; background: white; margin-bottom: 10px; border-radius: 8px;
                                box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: transform 0.2s;">
                        <div style="display: flex; align-items: center; gap: 15px; flex: 1;">
                            <div style="width: 60px; height: 60px; overflow: hidden; border-radius: 6px; background: #f8f9fa; 
                                        display: flex; align-items: center; justify-content: center;">
                                <img src="${imagenSrc}" 
                                     alt="${producto.nombre}" 
                                     style="width: 100%; height: 100%; object-fit: contain;"
                                     onerror="this.src='https://via.placeholder.com/60x60/cccccc/969696?text=IMG'">
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #333; font-size: 16px; margin-bottom: 5px;">
                                    ${producto.nombre}
                                </div>
                                <div style="color: #4CAF50; font-weight: bold; font-size: 18px; margin: 5px 0;">
                                    ${producto.precio}
                                </div>
                                <div style="color: #666; font-size: 14px; margin-top: 5px; line-height: 1.4;">
                                    ${producto.descripcion.substring(0, 80)}${producto.descripcion.length > 80 ? '...' : ''}
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="auth-btn" onclick="window.editarProducto('${producto.id}')" 
                                    style="padding: 8px 15px; font-size: 13px; background: linear-gradient(135deg, #2196F3, #1976D2); 
                                           color: white; border: none; border-radius: 6px; cursor: pointer;">
                                ✏️ Editar
                            </button>
                            <button class="auth-btn" onclick="window.eliminarProducto('${producto.id}')" 
                                    style="padding: 8px 15px; font-size: 13px; background: linear-gradient(135deg, #f44336, #d32f2f); 
                                           color: white; border: none; border-radius: 6px; cursor: pointer;">
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        listaProductosAdmin.innerHTML = html;
        
        if (contadorProductos) {
            contadorProductos.textContent = productosActuales.length;
        }
    }
    
    async function guardarProducto(e) {
        e.preventDefault();
        
        // Obtener valores
        const nombre = document.getElementById('adminNombre').value.trim();
        let precio = document.getElementById('adminPrecio').value.trim();
        const imagenInput = document.getElementById('adminImagen').value.trim();
        const descripcion = document.getElementById('adminDescripcion').value.trim();
        const caracteristicasTexto = document.getElementById('adminCaracteristicas').value;
        const productoId = document.getElementById('productoId').value;
        
        // Validaciones
        if (!nombre || !precio || !imagenInput || !descripcion) {
            mostrarNotificacion('❌ Complete todos los campos obligatorios', 'error');
            return;
        }
        
        // Formatear precio
        if (!precio.startsWith('$')) {
            precio = '$' + precio.replace('$', '');
        }
        
        const caracteristicas = caracteristicasTexto
            .split('\n')
            .map(c => c.trim())
            .filter(c => c !== '');
        
        let imagenFinal = imagenInput;
        if (productoId && productoEditando && imagenActual) {
            imagenFinal = imagenActual.nombre;
        }
        
        // Crear objeto producto
        const producto = {
            nombre,
            precio,
            imagen: imagenFinal,
            descripcion,
            caracteristicas
        };
        
        if (productoId && productoEditando !== null) {
            // Editar producto existente
            const exito = actualizarProductoDB(productoId, producto);
            if (exito) {
                mostrarNotificacion('✅ Producto actualizado correctamente', 'success');
                
                // Ofrecer copiar para Google Sheets
                mostrarOpcionGoogleSheets(productoId, producto);
                
                productoEditando = null;
                imagenActual = null;
            } else {
                mostrarNotificacion('❌ Error al actualizar producto', 'error');
                return;
            }
        } else {
            // Crear nuevo producto
            const nuevoProducto = {
                id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                ...producto
            };
            
            const resultado = agregarProductoDB(nuevoProducto);
            if (resultado) {
                mostrarNotificacion('✅ Producto agregado correctamente', 'success');
                
                // Ofrecer copiar para Google Sheets
                mostrarOpcionGoogleSheets(nuevoProducto.id, nuevoProducto);
            } else {
                mostrarNotificacion('❌ Error al agregar producto', 'error');
                return;
            }
        }
        
        // Actualizar interfaz
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
    
    function resetFormProducto() {
        if (formProducto) {
            formProducto.reset();
        }
        productoEditando = null;
        imagenActual = null;
        document.getElementById('productoId').value = '';
        document.getElementById('tituloFormProducto').textContent = 'Agregar Nuevo Producto';
        document.getElementById('adminPrecio').placeholder = '$8.000';
        resetImagePreview();
    }
    
    // ========== FUNCIONES DE PRODUCTOS ==========
    function obtenerProductos() {
        return window.ProductosDB ? window.ProductosDB.obtenerTodos() : [];
    }
    
    function agregarProductoDB(nuevoProducto) {
        if (window.ProductosDB) {
            return window.ProductosDB.agregar(nuevoProducto);
        }
        return null;
    }
    
    function actualizarProductoDB(id, datos) {
        if (window.ProductosDB) {
            return window.ProductosDB.actualizar(id, datos);
        }
        return false;
    }
    
    function eliminarProductoDB(id) {
        if (window.ProductosDB) {
            return window.ProductosDB.eliminar(id);
        }
        return false;
    }
    
    // ========== FUNCIONES GLOBALES ==========
    window.editarProducto = function(id) {
        if (!esAdmin) {
            mostrarNotificacion('❌ No tienes permisos para editar', 'error');
            return;
        }
        
        const productosActuales = obtenerProductos();
        const producto = productosActuales.find(p => p.id === id);
        if (!producto) {
            mostrarNotificacion('❌ Producto no encontrado', 'error');
            return;
        }
        
        productoEditando = producto;
        
        document.getElementById('productoId').value = producto.id;
        document.getElementById('adminNombre').value = producto.nombre;
        document.getElementById('adminPrecio').value = producto.precio;
        document.getElementById('adminImagen').value = producto.imagen;
        document.getElementById('adminDescripcion').value = producto.descripcion;
        document.getElementById('adminCaracteristicas').value = producto.caracteristicas.join('\n');
        
        document.getElementById('tituloFormProducto').textContent = 'Editar Producto';
        
        // Cargar imagen si existe
        if (producto.imagen) {
            try {
                const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
                if (imagenesGuardadas[producto.imagen]) {
                    const imagePreview = document.getElementById('imagePreview');
                    const previewContainer = document.getElementById('previewContainer');
                    const previewName = document.getElementById('previewName');
                    const dragDropContent = document.querySelector('.drag-drop-content');
                    
                    if (imagePreview && previewContainer) {
                        imagePreview.src = imagenesGuardadas[producto.imagen];
                        previewName.textContent = producto.imagen;
                        previewContainer.style.display = 'flex';
                        if (dragDropContent) {
                            dragDropContent.style.display = 'none';
                        }
                        imagenActual = {
                            nombre: producto.imagen,
                            dataURL: imagenesGuardadas[producto.imagen]
                        };
                    }
                }
            } catch (error) {
                console.error('Error cargando imagen para edición:', error);
            }
        }
    };
    
    window.eliminarProducto = function(id) {
        if (!esAdmin) {
            mostrarNotificacion('❌ No tienes permisos para eliminar', 'error');
            return;
        }
        
        const productosActuales = obtenerProductos();
        const producto = productosActuales.find(p => p.id === id);
        if (!producto) {
            mostrarNotificacion('❌ Producto no encontrado', 'error');
            return;
        }
        
        if (!confirm(`⚠️ ¿ELIMINAR PRODUCTO DEFINITIVAMENTE?\n\n` +
                    `"${producto.nombre}"\n` +
                    `Precio: ${producto.precio}\n\n` +
                    `Esta acción no se puede deshacer.`)) {
            return;
        }
        
        const exito = eliminarProductoDB(id);
        if (exito) {
            cargarListaProductosAdmin();
            
            if (typeof window.cargarProductos === 'function') {
                window.cargarProductos();
            }
            
            mostrarNotificacion(`🗑️ Producto "${producto.nombre}" eliminado`, 'info');
        } else {
            mostrarNotificacion('❌ Error al eliminar producto', 'error');
        }
    };
    
    // ========== NOTIFICACIONES ==========
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Remover notificaciones anteriores
        const notificacionesAnteriores = document.querySelectorAll('.notificacion-flotante');
        notificacionesAnteriores.forEach(n => n.remove());
        
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-flotante';
        
        const icono = tipo === 'success' ? '✅' : 
                     tipo === 'error' ? '❌' : 
                     tipo === 'info' ? 'ℹ️' : '🔔';
        
        const color = tipo === 'success' ? '#4CAF50' : 
                     tipo === 'error' ? '#f44336' : 
                     tipo === 'info' ? '#2196F3' : '#FF9800';
        
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${color};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 350px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 12px;
            border-left: 5px solid ${tipo === 'success' ? '#2E7D32' : 
                                 tipo === 'error' ? '#C62828' : 
                                 tipo === 'info' ? '#1565C0' : '#EF6C00'};
        `;
        
        notificacion.innerHTML = `
            <span style="font-size: 20px;">${icono}</span>
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
        }, 4000);
    }
    
    // ========== INICIAR ==========
    inicializar();
});