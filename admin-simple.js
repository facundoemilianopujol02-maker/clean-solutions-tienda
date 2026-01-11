// admin-simple.js - Sistema de administración con precio fijo con $, drag & drop e importar/exportar

document.addEventListener('DOMContentLoaded', function() {
    // ========== CONFIGURACIÓN ==========
    const CLAVE_ADMIN = "ragnar610"; // ¡CAMBIA ESTA CLAVE POR UNA SEGURA!
    const ADMIN_KEY = 'cleanSolutionsAdmin';
    
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
    
    // Elementos del formulario de producto
    const inputPrecio = document.getElementById('adminPrecio');
    
    // ========== ESTADO ==========
    let esAdmin = false;
    let productoEditando = null;
    let imagenActual = null; // Para almacenar la imagen actual en edición
    
    // ========== INICIALIZACIÓN ==========
    function inicializar() {
        console.log('⚙️ Sistema administrativo inicializando...');
        verificarSesionAdmin();
        configurarEventos();
        crearBotonReset();
        crearBotonesImportExport(); // ← NUEVO: Botones importar/exportar
        configurarInputPrecio();
        configurarDragDrop();
        console.log('✅ Sistema administrativo listo');
    }
    
    // ========== SISTEMA DE IMPORTAR/EXPORTAR ==========
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
    }
    
    // Función para exportar productos a JSON
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
    
    // Función para importar productos desde archivo JSON
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
    
    // ========== SISTEMA DE ARRASTRE Y SOLTADO ==========
    function configurarDragDrop() {
        const dragDropArea = document.getElementById('dragDropArea');
        const fileInput = document.getElementById('adminImagenFile');
        const previewContainer = document.getElementById('previewContainer');
        const imagePreview = document.getElementById('imagePreview');
        const previewName = document.getElementById('previewName');
        const removePreview = document.getElementById('removePreview');
        const imageInput = document.getElementById('adminImagen');

        if (!dragDropArea || !fileInput) return;

        // Prevenir comportamientos por defecto
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dragDropArea.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Efectos visuales al arrastrar
        ['dragenter', 'dragover'].forEach(eventName => {
            dragDropArea.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dragDropArea.addEventListener(eventName, unhighlight, false);
        });

        function highlight() {
            dragDropArea.classList.add('dragover');
        }

        function unhighlight() {
            dragDropArea.classList.remove('dragover');
        }

        // Manejar archivos soltados
        dragDropArea.addEventListener('drop', handleDrop, false);
        
        // Manejar clic para seleccionar archivo
        dragDropArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Manejar selección de archivo
        fileInput.addEventListener('change', handleFileSelect);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }

        function handleFileSelect(e) {
            const files = e.target.files;
            handleFiles(files);
        }

        function handleFiles(files) {
            if (files.length === 0) return;
            
            const file = files[0];
            
            // Validar tipo de archivo
            if (!file.type.match('image.*')) {
                mostrarNotificacion('❌ Solo se permiten archivos de imagen', 'error');
                return;
            }
            
            // Validar tamaño (5MB máximo)
            if (file.size > 5 * 1024 * 1024) {
                mostrarNotificacion('❌ La imagen no debe superar los 5MB', 'error');
                return;
            }
            
            // Mostrar preview
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewName.textContent = file.name;
                previewContainer.style.display = 'flex';
                dragDropArea.querySelector('.drag-drop-content').style.display = 'none';
                
                // Guardar solo el nombre del archivo
                imageInput.value = file.name;
                imagenActual = {
                    nombre: file.name,
                    dataURL: e.target.result
                };
                
                // Guardar el archivo en localStorage
                guardarImagenEnStorage(file.name, e.target.result);
            };
            reader.readAsDataURL(file);
        }

        // Botón para eliminar preview
        removePreview.addEventListener('click', function(e) {
            e.stopPropagation();
            resetImagePreview();
        });

        function resetImagePreview() {
            imagePreview.src = '';
            previewName.textContent = '';
            previewContainer.style.display = 'none';
            dragDropArea.querySelector('.drag-drop-content').style.display = 'flex';
            imageInput.value = '';
            fileInput.value = '';
            imagenActual = null;
        }

        // También resetear cuando se resetea el formulario
        const resetButton = document.getElementById('btnCancelarEdicion');
        if (resetButton) {
            resetButton.addEventListener('click', resetImagePreview);
        }
    }

    // Función para guardar imágenes en localStorage
    function guardarImagenEnStorage(nombre, dataURL) {
        try {
            const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
            imagenesGuardadas[nombre] = dataURL;
            localStorage.setItem('cleanSolutionsImages', JSON.stringify(imagenesGuardadas));
            console.log(`💾 Imagen guardada en storage: ${nombre}`);
        } catch (error) {
            console.error('Error al guardar imagen:', error);
        }
    }

    // Función para cargar imagen desde localStorage
    function cargarImagenDesdeStorage(nombre) {
        try {
            const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
            return imagenesGuardadas[nombre] || null;
        } catch (error) {
            console.error('Error al cargar imagen:', error);
            return null;
        }
    }
    
    // ========== CONFIGURACIÓN DEL INPUT DE PRECIO ==========
    function configurarInputPrecio() {
        if (!inputPrecio) return;
        
        // Establecer placeholder con $
        inputPrecio.placeholder = '$8.000';
        
        // Agregar $ automáticamente al enfocar si no lo tiene
        inputPrecio.addEventListener('focus', function() {
            if (!this.value.startsWith('$')) {
                this.value = '$' + this.value.replace('$', '');
            }
        });
        
        // Validar y mantener el $ mientras se escribe
        inputPrecio.addEventListener('input', function() {
            const valor = this.value;
            
            // Si el usuario borra todo, mantener solo $
            if (valor === '') {
                this.value = '$';
                return;
            }
            
            // Si no empieza con $, agregarlo
            if (!valor.startsWith('$')) {
                this.value = '$' + valor.replace('$', '');
            }
            
            // Permitir solo números después del $
            const sinDolar = valor.substring(1);
            const soloNumeros = sinDolar.replace(/[^\d]/g, '');
            
            // Formatear con separador de miles opcional
            if (soloNumeros.length > 0) {
                const numero = parseInt(soloNumeros, 10);
                if (!isNaN(numero)) {
                    // Formato: $8.000 o $1.000.000
                    const formateado = numero.toLocaleString('es-AR');
                    this.value = '$' + formateado;
                }
            }
        });
        
        // Prevenir que se borre el $
        inputPrecio.addEventListener('keydown', function(e) {
            const cursorPos = this.selectionStart;
            
            // Si el cursor está al inicio (antes del $) y presiona backspace/delete
            if (cursorPos === 0 && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
                return;
            }
            
            // Si intenta borrar el $ directamente
            if (cursorPos === 1 && e.key === 'Backspace') {
                e.preventDefault();
                // Mover cursor después del $
                this.setSelectionRange(1, 1);
            }
        });
        
        // Validar al perder el foco
        inputPrecio.addEventListener('blur', function() {
            const valor = this.value.trim();
            
            if (valor === '$') {
                this.value = '';
                this.placeholder = '$8.000';
            } else if (valor && !valor.startsWith('$')) {
                this.value = '$' + valor.replace('$', '');
            }
            
            // Asegurar que tenga al menos un número después del $
            if (valor.length > 1 && valor.startsWith('$')) {
                const soloNumeros = valor.substring(1).replace(/[^\d]/g, '');
                if (soloNumeros.length === 0) {
                    this.value = '';
                    this.placeholder = '$8.000';
                }
            }
        });
    }
    
    // Función para formatear precio automáticamente
    function formatearPrecio(valor) {
        if (!valor) return '';
        
        // Eliminar cualquier $ existente
        let sinDolar = valor.replace('$', '').trim();
        
        // Si está vacío, devolver solo $
        if (sinDolar === '') return '$';
        
        // Eliminar caracteres no numéricos
        const soloNumeros = sinDolar.replace(/[^\d]/g, '');
        
        // Si no hay números, devolver solo $
        if (soloNumeros === '') return '$';
        
        // Convertir a número y formatear
        const numero = parseInt(soloNumeros, 10);
        if (isNaN(numero)) return '$';
        
        // Formatear con separadores de miles
        return '$' + numero.toLocaleString('es-AR');
    }
    
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
        
        // Mostrar botón de reset
        const btnReset = document.getElementById('btnResetProductos');
        if (btnReset) btnReset.style.display = 'block';
        
        // Mostrar botones de import/export
        const importExportContainer = document.getElementById('importExportContainer');
        if (importExportContainer) importExportContainer.style.display = 'flex';
        
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
        
        // Ocultar botón de reset
        const btnReset = document.getElementById('btnResetProductos');
        if (btnReset) btnReset.style.display = 'none';
        
        // Ocultar botones de import/export
        const importExportContainer = document.getElementById('importExportContainer');
        if (importExportContainer) importExportContainer.style.display = 'none';
        
        cerrarModalGestion();
        mostrarNotificacion('🔒 Sesión administrativa cerrada', 'info');
        console.log('🚪 Sesión administrativa cerrada');
    }
    
    // ========== EVENTOS ==========
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
            
            // Enter para enviar
            document.getElementById('claveAdmin')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    verificarClave();
                }
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
        
        // Cancelar edición
        document.getElementById('btnCancelarEdicion')?.addEventListener('click', () => {
            resetFormProducto();
        });
        
        // Formulario producto
        if (formProducto) {
            formProducto.addEventListener('submit', guardarProducto);
        }
        
        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modalAccesoAdmin.style.display = 'none';
                cerrarModalGestion();
            }
        });
        
        // Cerrar sesión admin con doble clic en logo (función oculta)
        document.querySelector('.logoContainer')?.addEventListener('dblclick', () => {
            if (esAdmin) {
                if (confirm('¿Cerrar sesión administrativa (doble clic)?')) {
                    desactivarModoAdmin();
                }
            }
        });
        
        // Cerrar al hacer clic fuera del modal
        modalAccesoAdmin?.addEventListener('click', (e) => {
            if (e.target === modalAccesoAdmin) {
                modalAccesoAdmin.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        modalGestionProductos?.addEventListener('click', (e) => {
            if (e.target === modalGestionProductos) {
                cerrarModalGestion();
            }
        });
    }
    
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
            
            // Mostrar botón de reset
            document.getElementById('resetContainer').style.display = 'block';
            
            // Mostrar botones de import/export
            const importExportContainer = document.getElementById('importExportContainer');
            if (importExportContainer) importExportContainer.style.display = 'flex';
            
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
                // Intentar cargar imagen desde localStorage para mostrar preview
                let imagenSrc = producto.imagen;
                const dataURL = cargarImagenDesdeStorage(producto.imagen);
                if (dataURL) {
                    imagenSrc = dataURL;
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
                                <div style="font-size: 11px; color: #999; margin-top: 8px;">
                                    <strong>ID:</strong> ${producto.id.substring(0, 12)}...
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="auth-btn" onclick="window.editarProducto('${producto.id}')" 
                                    style="padding: 8px 15px; font-size: 13px; background: linear-gradient(135deg, #2196F3, #1976D2); 
                                           color: white; border: none; border-radius: 6px; cursor: pointer;
                                           display: flex; align-items: center; gap: 5px;">
                                ✏️ Editar
                            </button>
                            <button class="auth-btn" onclick="window.eliminarProducto('${producto.id}')" 
                                    style="padding: 8px 15px; font-size: 13px; background: linear-gradient(135deg, #f44336, #d32f2f); 
                                           color: white; border: none; border-radius: 6px; cursor: pointer;
                                           display: flex; align-items: center; gap: 5px;">
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
            contadorProductos.style.fontWeight = 'bold';
            contadorProductos.style.color = '#2196F3';
        }
        
        // Agregar hover effect
        document.querySelectorAll('.producto-admin-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateY(-2px)';
                item.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateY(0)';
                item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
            });
        });
    }
    
    function guardarProducto(e) {
        e.preventDefault();
        
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
        
        // Asegurar que el precio tenga $
        if (!precio.startsWith('$')) {
            precio = '$' + precio.replace('$', '');
        }
        
        // Validar que haya números después del $
        const soloNumeros = precio.substring(1).replace(/[^\d]/g, '');
        if (soloNumeros.length === 0) {
            mostrarNotificacion('❌ Ingrese un precio válido después del $', 'error');
            inputPrecio.focus();
            inputPrecio.select();
            return;
        }
        
        // Formatear precio con separadores de miles
        const numero = parseInt(soloNumeros, 10);
        if (!isNaN(numero)) {
            precio = '$' + numero.toLocaleString('es-AR');
        }
        
        const caracteristicas = caracteristicasTexto
            .split('\n')
            .map(c => c.trim())
            .filter(c => c !== '');
        
        // Si estamos editando y no se cambió la imagen, mantener la existente
        let imagenFinal = imagenInput;
        if (productoId && productoEditando && imagenActual) {
            imagenFinal = imagenActual.nombre;
        }
        
        if (productoId && productoEditando !== null) {
            // Editar producto existente
            const exito = actualizarProductoDB(productoId, {
                nombre,
                precio,
                imagen: imagenFinal,
                descripcion,
                caracteristicas
            });
            
            if (exito) {
                mostrarNotificacion('✅ Producto actualizado correctamente', 'success');
                productoEditando = null;
                imagenActual = null;
                document.getElementById('tituloFormProducto').textContent = 'Agregar Nuevo Producto';
                console.log(`✏️ Producto editado: ${nombre}`);
            } else {
                mostrarNotificacion('❌ Error al actualizar producto', 'error');
                return;
            }
        } else {
            // Crear nuevo producto
            const nuevoProducto = {
                id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                nombre,
                precio,
                imagen: imagenFinal,
                descripcion,
                caracteristicas
            };
            
            const resultado = agregarProductoDB(nuevoProducto);
            if (resultado) {
                mostrarNotificacion('✅ Producto agregado correctamente', 'success');
                console.log(`➕ Producto agregado: ${nombre}`);
            } else {
                mostrarNotificacion('❌ Error al agregar producto', 'error');
                return;
            }
        }
        
        // Actualizar interfaz
        resetFormProducto();
        cargarListaProductosAdmin();
        
        // Recargar productos en la página principal
        if (typeof window.cargarProductos === 'function') {
            window.cargarProductos();
        }
        
        // Guardar cambios finales
        if (window.ProductosDB && window.ProductosDB.guardar) {
            window.ProductosDB.guardar();
        }
        
        // Enfocar el campo de nombre para siguiente producto
        document.getElementById('adminNombre').focus();
    }
    
    // Agrega esta función en admin-simple.js (después de guardarProducto)
function mostrarOpcionesGoogleSheets(producto) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const datosParaSheets = `
Agrega esta fila en Google Sheets:

📋 COPIA Y PEGA EN LA SIGUIENTE FILA VACÍA:

${producto.id || 'nuevo-' + Date.now()}	${producto.nombre}	${producto.precio}	${producto.imagen}	${producto.descripcion}	${producto.caracteristicas.join('|')}

👉 https://docs.google.com/spreadsheets/d/1GAUcFQMLBDyuQQhc79RvPEOrkyXet5dtpsDUkxPnLsY/edit
    `.trim();
    
    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 10px; max-width: 600px; width: 90%;">
            <h3 style="margin-bottom: 15px;">📤 ¿Compartir producto con todos los clientes?</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-family: monospace; white-space: pre-wrap; font-size: 14px;">
                ${datosParaSheets}
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button id="copiarDatos" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    📋 Copiar datos
                </button>
                <button id="abrirSheets" style="padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🔗 Abrir Google Sheets
                </button>
                <button id="cerrarModal" style="padding: 10px 20px; background: #f0f0f0; color: #333; border: none; border-radius: 5px; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('copiarDatos').addEventListener('click', function() {
        const texto = `${producto.id || 'nuevo-' + Date.now()}\t${producto.nombre}\t${producto.precio}\t${producto.imagen}\t${producto.descripcion}\t${producto.caracteristicas.join('|')}`;
        
        navigator.clipboard.writeText(texto)
            .then(() => {
                this.textContent = '✅ ¡Copiado!';
                this.style.background = '#2E7D32';
                setTimeout(() => {
                    this.textContent = '📋 Copiar datos';
                    this.style.background = '#4CAF50';
                }, 2000);
            })
            .catch(() => {
                alert('Copia manual: ' + texto);
            });
    });
    
    document.getElementById('abrirSheets').addEventListener('click', function() {
        window.open('https://docs.google.com/spreadsheets/d/1GAUcFQMLBDyuQQhc79RvPEOrkyXet5dtpsDUkxPnLsY/edit', '_blank');
    });
    
    document.getElementById('cerrarModal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Luego, en la función guardarProducto, después de guardar:
// Agrega esta línea al final:
mostrarOpcionesGoogleSheets({
    id: productoId || nuevoProducto.id,
    nombre: nombre,
    precio: precio,
    imagen: imagenFinal,
    descripcion: descripcion,
    caracteristicas: caracteristicas
});
    function resetFormProducto() {
        if (formProducto) {
            formProducto.reset();
        }
        productoEditando = null;
        imagenActual = null;
        document.getElementById('productoId').value = '';
        document.getElementById('tituloFormProducto').textContent = 'Agregar Nuevo Producto';
        document.getElementById('adminNombre').placeholder = 'Ej: Jabón Líquido Ariel';
        document.getElementById('adminPrecio').value = '';
        document.getElementById('adminPrecio').placeholder = '$8.000';
        
        // Resetear área de drag & drop
        const previewContainer = document.getElementById('previewContainer');
        const dragDropContent = document.querySelector('.drag-drop-content');
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        if (dragDropContent) {
            dragDropContent.style.display = 'flex';
        }
    }
    
    // ========== FUNCIONES DE PRODUCTOS ==========
    function obtenerProductos() {
    if (window.ProductosDB && window.ProductosDB.obtenerTodos) {
        // Si es async (promesa), manejarlo
        const resultado = window.ProductosDB.obtenerTodos();
        if (resultado && typeof resultado.then === 'function') {
            // Es una promesa, devolver array vacío temporal
            return [];
        }
        return resultado || [];
    }
    return [];
}
    
    function agregarProductoDB(nuevoProducto) {
        if (window.ProductosDB) {
            return window.ProductosDB.agregar(nuevoProducto);
        } else {
            const productosActuales = obtenerProductos();
            productosActuales.push(nuevoProducto);
            return nuevoProducto;
        }
    }
    
    function actualizarProductoDB(id, datos) {
        if (window.ProductosDB) {
            return window.ProductosDB.actualizar(id, datos);
        } else {
            const productosActuales = obtenerProductos();
            const index = productosActuales.findIndex(p => p.id === id);
            if (index !== -1) {
                productosActuales[index] = { ...productosActuales[index], ...datos };
                return true;
            }
            return false;
        }
    }
    
    function eliminarProductoDB(id) {
        if (window.ProductosDB) {
            return window.ProductosDB.eliminar(id);
        } else {
            const productosActuales = obtenerProductos();
            const index = productosActuales.findIndex(p => p.id === id);
            if (index !== -1) {
                productosActuales.splice(index, 1);
                return true;
            }
            return false;
        }
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
        document.getElementById('adminNombre').focus();
        
        // Asegurar que el precio muestre el $
        if (inputPrecio && !inputPrecio.value.startsWith('$') && inputPrecio.value) {
            inputPrecio.value = '$' + inputPrecio.value.replace('$', '');
        }
        
        // Cargar imagen si existe
        if (producto.imagen) {
            const dataURL = cargarImagenDesdeStorage(producto.imagen);
            if (dataURL) {
                const imagePreview = document.getElementById('imagePreview');
                const previewContainer = document.getElementById('previewContainer');
                const previewName = document.getElementById('previewName');
                const dragDropContent = document.querySelector('.drag-drop-content');
                
                if (imagePreview && previewContainer) {
                    imagePreview.src = dataURL;
                    previewName.textContent = producto.imagen;
                    previewContainer.style.display = 'flex';
                    if (dragDropContent) {
                        dragDropContent.style.display = 'none';
                    }
                    imagenActual = {
                        nombre: producto.imagen,
                        dataURL: dataURL
                    };
                }
            }
        }
        
        // Desplazar suavemente al formulario
        document.querySelector('.admin-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        console.log(`📝 Editando producto: ${producto.nombre}`);
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
            console.log(`🗑️ Producto eliminado: ${producto.nombre}`);
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
    
    // Agregar animaciones si no existen
    if (!document.querySelector('style#animaciones-notificacion')) {
        const style = document.createElement('style');
        style.id = 'animaciones-notificacion';
        style.textContent = `
            @keyframes slideInRight {
                from { 
                    transform: translateX(100%); 
                    opacity: 0; 
                }
                to { 
                    transform: translateX(0); 
                    opacity: 1; 
                }
            }
            @keyframes slideOutRight {
                from { 
                    transform: translateX(0); 
                    opacity: 1; 
                }
                to { 
                    transform: translateX(100%); 
                    opacity: 0; 
                }
            }
            
            /* Estilo para el input de precio */
            #adminPrecio {
                font-family: monospace;
                font-weight: bold;
                color: #2E7D32;
            }
            
            #adminPrecio::placeholder {
                color: #666;
                font-weight: normal;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========== INICIAR ==========
    inicializar();
    
    // Función global para verificar estado admin (para debug)
    window.verificarEstadoAdmin = function() {
        console.log('🔍 Estado administrativo:', {
            esAdmin: esAdmin,
            sesionGuardada: localStorage.getItem(ADMIN_KEY),
            productos: obtenerProductos().length,
            imagenes: Object.keys(JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}')).length
        });
    };
    
    // Función global para exportar (disponible desde consola)
    window.exportarProductosGlobal = exportarProductos;
});