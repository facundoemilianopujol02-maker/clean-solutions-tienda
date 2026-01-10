// script.js - Funcionalidad principal SIMPLIFICADA
// Solo catálogo y búsqueda de productos (sin autenticación)

document.addEventListener('DOMContentLoaded', function() {
    // ========== FUNCIÓN PARA OBTENER PRODUCTOS ==========
    function obtenerProductosActuales() {
        return window.ProductosDB ? window.ProductosDB.obtenerTodos() : [];
    }
    
    // Función para cargar imagen desde localStorage (AGREGADA)
    function cargarImagenDesdeStorage(nombre) {
        try {
            const imagenesGuardadas = JSON.parse(localStorage.getItem('cleanSolutionsImages') || '{}');
            return imagenesGuardadas[nombre] || null;
        } catch (error) {
            console.error('Error al cargar imagen:', error);
            return null;
        }
    }

    // ========== ELEMENTOS DEL DOM ==========
    const modalOverlay = document.getElementById('modalOverlay');
    const modalCerrar = document.getElementById('modalCerrar');
    const modalCuerpo = document.getElementById('modalCuerpo');
    const contenedorProductos = document.getElementById('contenedorProductos');
    const busquedaInput = document.querySelector('.busquedaInput');
    const busquedaForma = document.querySelector('.busquedaForma');
    const contadorResultados = document.querySelector('.contador-resultados');
    
    // ========== VERIFICACIÓN DE ELEMENTOS ==========
    if (!modalOverlay || !modalCerrar || !modalCuerpo || !contenedorProductos) {
        console.error('Error: Elementos del DOM no encontrados');
        return;
    }
    
    // ========== DATOS ESTÁTICOS ==========
    const misDatos = {
        whatsapp: '+3794034489',
        correo: 'npamaciel@gmail.com',
        instagram: '@clean.solutions610',
        horario: 'Lunes a Sábado: 8:00 AM - 9:00 PM',
        direccion: 'Bruno Esquivel 1130'
    };
    
    // ========== ESTADO DE LA APLICACIÓN ==========
    let productosFiltrados = [...obtenerProductosActuales()];
    
    // ========== INICIALIZACIÓN ==========
    function inicializar() {
        console.log('🛒 Inicializando catálogo de productos...');
        console.log(`📊 Productos cargados: ${obtenerProductosActuales().length}`);
        
        cargarProductos();
        configurarEventos();
        
        console.log('✅ CleanSolutions - Página cargada correctamente');
    }
    
    // ========== FUNCIONES DE UTILIDAD ==========
    function normalizarTexto(texto) {
        if (!texto) return '';
        return texto.toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }
    
    function crearCardProducto(producto) {
        // Intentar cargar imagen desde localStorage (MODIFICADO)
        let imagenSrc = producto.imagen;
        
        // Verificar si es una imagen local (sin http/https) o una imagen por defecto
        if (producto.imagen && !producto.imagen.startsWith('http') && !producto.imagen.startsWith('data:')) {
            const dataURL = cargarImagenDesdeStorage(producto.imagen);
            if (dataURL) {
                imagenSrc = dataURL;
            }
        }
        
        return `
            <article class="cardProducto">
                <div class="productoImagen">
                    <img src="${imagenSrc}" 
                         alt="${producto.nombre}" 
                         loading="lazy"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300/cccccc/969696?text=Imagen+no+disponible'">
                </div>
                <div class="productoInfo">
                    <h3 class="productoNombre">${producto.nombre}</h3>
                    <div class="productoPrecio">${producto.precio}</div>
                    <button class="botonVerDetalles" data-producto="${producto.id}">
                        Ver detalles
                    </button>
                </div>
            </article>
        `;
    }
    
    function cargarProductos(productosArray = obtenerProductosActuales()) {
        contenedorProductos.innerHTML = '';
        
        if (productosArray.length === 0) {
            contenedorProductos.innerHTML = `
                <div class="no-resultados">
                    <p>🔍 No se encontraron productos</p>
                    <p>Intenta con otra búsqueda</p>
                </div>
            `;
            return;
        }
        
        productosArray.forEach((producto) => {
            const cardHTML = crearCardProducto(producto);
            contenedorProductos.insertAdjacentHTML('beforeend', cardHTML);
        });
        
        agregarEventosBotones();
    }
    
    function agregarEventosBotones() {
        document.querySelectorAll('.botonVerDetalles').forEach(boton => {
            boton.addEventListener('click', function() {
                const productoId = this.getAttribute('data-producto');
                abrirModal(productoId);
            });
        });
    }
    
    // ========== FUNCIONALIDAD DE BÚSQUEDA ==========
    function buscarProductos(termino) {
        const terminoNormalizado = normalizarTexto(termino);
        const productosActuales = obtenerProductosActuales();
        
        if (!terminoNormalizado) {
            productosFiltrados = [...productosActuales];
        } else {
            productosFiltrados = productosActuales.filter(producto => {
                const nombreNormalizado = normalizarTexto(producto.nombre);
                const descripcionNormalizada = normalizarTexto(producto.descripcion);
                
                if (nombreNormalizado.includes(terminoNormalizado)) return true;
                if (descripcionNormalizada.includes(terminoNormalizado)) return true;
                
                return producto.caracteristicas.some(c =>
                    normalizarTexto(c).includes(terminoNormalizado)
                );
            });
        }
        
        cargarProductos(productosFiltrados);
        mostrarContadorResultados(terminoNormalizado, productosFiltrados.length);
    }
    
    function mostrarContadorResultados(termino, cantidad) {
        if (!contadorResultados) return;
        
        if (!termino || termino === '') {
            contadorResultados.style.display = 'none';
            contadorResultados.textContent = '';
        } else {
            contadorResultados.style.display = 'block';
            const texto = cantidad === 0 
                ? '❌ No se encontraron productos'
                : `✅ ${cantidad} producto${cantidad !== 1 ? 's' : ''} encontrado${cantidad !== 1 ? 's' : ''}`;
            contadorResultados.textContent = texto;
        }
    }
    
    // ========== MODAL DE DETALLES DEL PRODUCTO ==========
    function abrirModal(productoId) {
        const productosActuales = obtenerProductosActuales();
        const producto = productosActuales.find(p => p.id === productoId);
        
        if (!producto) {
            console.error('Producto no encontrado:', productoId);
            return;
        }
        
        // Intentar cargar imagen desde localStorage (MODIFICADO)
        let imagenSrc = producto.imagen;
        if (producto.imagen && !producto.imagen.startsWith('http') && !producto.imagen.startsWith('data:')) {
            const dataURL = cargarImagenDesdeStorage(producto.imagen);
            if (dataURL) {
                imagenSrc = dataURL;
            }
        }
        
        modalCuerpo.innerHTML = `
            <div class="detalles-producto">
                <div class="detalles-imagen">
                    <img src="${imagenSrc}" 
                         alt="${producto.nombre}"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300/cccccc/969696?text=Imagen+no+disponible'">
                </div>
                <div class="detalles-info">
                    <h2>${producto.nombre}</h2>
                    <div class="detalles-precio">${producto.precio}</div>
                    <p class="detalles-descripcion">${producto.descripcion}</p>
                    
                    ${producto.caracteristicas.length > 0 ? `
                        <h3>Características:</h3>
                        <ul class="detalles-caracteristicas">
                            ${producto.caracteristicas.map(caract => 
                                `<li>${caract}</li>`
                            ).join('')}
                        </ul>
                    ` : ''}
                    
                    <button class="boton-contactar" 
                            data-producto-id="${producto.id}" 
                            data-producto-nombre="${producto.nombre}" 
                            data-producto-precio="${producto.precio}">
                        📞 Consultar sobre este producto
                    </button>
                    <button class="boton-cerrar-modal" style="margin-top: 10px; padding: 12px; background: #f0f0f0; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                        ← Volver a productos
                    </button>
                </div>
            </div>
        `;
        
        modalOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        const botonContactar = modalCuerpo.querySelector('.boton-contactar');
        if (botonContactar) {
            botonContactar.addEventListener('click', function() {
                const productoId = this.getAttribute('data-producto-id');
                const productoNombre = this.getAttribute('data-producto-nombre');
                const productoPrecio = this.getAttribute('data-producto-precio');
                abrirModalContacto(productoId, productoNombre, productoPrecio);
            });
        }
        
        const botonCerrar = modalCuerpo.querySelector('.boton-cerrar-modal');
        if (botonCerrar) {
            botonCerrar.addEventListener('click', cerrarModal);
        }
    }
    
    function abrirModalContacto(productoId, productoNombre, productoPrecio) {
        const mensajePredefinido = `Hola Clean Solutions! Estoy interesado en: ${productoNombre} - ${productoPrecio}`;
        
        const contactoHTML = `
            <div class="modal-contenido" style="max-width: 500px;">
                <button class="modal-cerrar" id="contactoCerrar">×</button>
                
                <div style="padding: 30px; text-align: center;">
                    <h2 style="margin-bottom: 20px;">Contactar sobre:</h2>
                    <h3 style="color: #333; margin-bottom: 10px;">${productoNombre}</h3>
                    <div style="background: #A6D8E5; color: #333; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 15px 0;">
                        ${productoPrecio}
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: left;">
                        <h4 style="margin-bottom: 15px;">📞 Datos de contacto:</h4>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>📱 WhatsApp:</strong><br>
                            <a href="https://wa.me/${misDatos.whatsapp.replace(/\D/g, '')}" 
                               target="_blank" style="color: #25D366; text-decoration: none;">
                                ${misDatos.whatsapp}
                            </a>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>✉️ Correo:</strong><br>
                            <a href="mailto:${misDatos.correo}" style="color: #EA4335; text-decoration: none;">
                                ${misDatos.correo}
                            </a>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>📸 Instagram:</strong><br>
                            <a href="https://instagram.com/${misDatos.instagram.replace('@', '')}" 
                               target="_blank" style="color: #E4405F; text-decoration: none;">
                                ${misDatos.instagram}
                            </a>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <strong>🕒 Horario:</strong><br>
                            ${misDatos.horario}
                        </div>
                        
                        <div>
                            <strong>📍 Dirección:</strong><br>
                            ${misDatos.direccion}
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <button id="btnWhatsApp" style="padding: 15px; background: #25D366; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
                            💬 Contactar por WhatsApp
                        </button>
                        <button id="btnCorreo" style="padding: 15px; background: #EA4335; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
                            ✉️ Enviar correo
                        </button>
                        <button id="cerrarContacto" style="padding: 12px; background: #f0f0f0; color: #333; border: none; border-radius: 5px; cursor: pointer;">
                            ← Volver al producto
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const contactoOverlay = document.createElement('div');
        contactoOverlay.className = 'modal-overlay';
        contactoOverlay.style.zIndex = '10000';
        contactoOverlay.innerHTML = contactoHTML;
        
        document.body.appendChild(contactoOverlay);
        contactoOverlay.style.display = 'flex';
        
        document.getElementById('contactoCerrar').addEventListener('click', () => {
            contactoOverlay.remove();
        });
        
        document.getElementById('cerrarContacto').addEventListener('click', () => {
            contactoOverlay.remove();
        });
        
        document.getElementById('btnWhatsApp').addEventListener('click', function() {
            const mensaje = encodeURIComponent(mensajePredefinido);
            const numeroLimpio = misDatos.whatsapp.replace(/\D/g, '');
            window.open(`https://wa.me/${numeroLimpio}?text=${mensaje}`, '_blank');
        });
        
        document.getElementById('btnCorreo').addEventListener('click', function() {
            const asunto = encodeURIComponent(`Consulta: ${productoNombre}`);
            const cuerpo = encodeURIComponent(`${mensajePredefinido}\n\nPor favor, envíenme más información.\n\nSaludos.`);
            window.location.href = `mailto:${misDatos.correo}?subject=${asunto}&body=${cuerpo}`;
        });
        
        contactoOverlay.addEventListener('click', function(e) {
            if (e.target === contactoOverlay) {
                contactoOverlay.remove();
            }
        });
    }
    
    function cerrarModal() {
        modalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // ========== CONFIGURACIÓN DE EVENTOS ==========
    function configurarEventos() {
        modalCerrar.addEventListener('click', cerrarModal);
        
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModal();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                cerrarModal();
            }
        });
        
        if (busquedaForma) {
            busquedaForma.addEventListener('submit', function(e) {
                e.preventDefault();
                buscarProductos(busquedaInput.value);
            });
            
            busquedaInput.addEventListener('input', function() {
                buscarProductos(this.value);
            });
            
            busquedaInput.addEventListener('search', function() {
                if (this.value === '') {
                    buscarProductos('');
                }
            });
        }
    }
    
    // ========== FUNCIÓN PÚBLICA PARA ADMIN ==========
    // Esta función será llamada por admin-simple.js cuando se agregue un producto
    window.cargarProductos = function() {
        const productosActuales = obtenerProductosActuales();
        productosFiltrados = [...productosActuales];
        cargarProductos();
    };
    
    // ========== INICIALIZAR ==========
    setTimeout(() => {
        inicializar();
        
        const urlParams = new URLSearchParams(window.location.search);
        const busquedaUrl = urlParams.get('buscar');
        if (busquedaUrl) {
            busquedaInput.value = busquedaUrl;
            buscarProductos(busquedaUrl);
        }
    }, 100);
});