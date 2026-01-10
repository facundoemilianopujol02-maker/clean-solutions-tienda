// productos.js - Con persistencia en localStorage

// Variables de imágenes por defecto
const IMAGEN_POR_DEFECTO = 'https://via.placeholder.com/300x300/cccccc/969696?text=Imagen+no+disponible';
const IMAGEN_POR_DEFECTO_CARD = 'https://via.placeholder.com/250x200/cccccc/969696?text=Sin+imagen';

// PRODUCTOS POR DEFECTO (backup inicial)
const PRODUCTOS_POR_DEFECTO = [
    {
        id: 'jabon-ariel',
        nombre: 'Jabón tipo Ariel - Limpieza Profunda',
        precio: '$8.000',
        imagen: 'jabonAriel.jpg', 
        descripcion: 'Jabón líquido tipo Ariel baja espuma.',
        caracteristicas: [
            'Precio por litro: $1.800'
        ]
    },
    {
        id: 'jabon-alaPan',
        nombre: 'Jabón blanco ala',
        precio: '$1.000',
        imagen: 'alapan.jpg', 
        descripcion: 'Jabón blanco ala x2 unidades.',
        caracteristicas: [
            'Pack de 2 unidades',
            'Para blanqueo profundo'
        ]
    },
    // ... todos tus productos actuales ...
    {
        id: 'toallita-always',
        nombre: 'Toallita Always',
        precio: '$1250',
        imagen: 'alwaysToallita.jpg',  
        descripcion: 'Toallitas Protectoras always.',
        caracteristicas: [
            'Tela suave',
            'Ajuste perfecto',
            'Nuevo pegamento'
        ]
    }
];

// CLAVE para localStorage
const PRODUCTOS_KEY = 'cleanSolutionsProductos_v1';

// Cargar productos desde localStorage o usar los por defecto
function cargarProductosDesdeStorage() {
    try {
        const productosGuardados = localStorage.getItem(PRODUCTOS_KEY);
        if (productosGuardados) {
            return JSON.parse(productosGuardados);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
    
    // Si no hay productos guardados, usar los por defecto
    guardarProductosEnStorage(PRODUCTOS_POR_DEFECTO);
    return PRODUCTOS_POR_DEFECTO;
}

// Guardar productos en localStorage
function guardarProductosEnStorage(productosArray) {
    try {
        localStorage.setItem(PRODUCTOS_KEY, JSON.stringify(productosArray));
        console.log(`💾 Productos guardados: ${productosArray.length} items`);
        return true;
    } catch (error) {
        console.error('Error al guardar productos:', error);
        return false;
    }
}

// Obtener la lista de productos (siempre desde storage)
let productos = cargarProductosDesdeStorage();

// Funciones para modificar productos
function agregarProducto(nuevoProducto) {
    productos.push(nuevoProducto);
    guardarProductosEnStorage(productos);
    return nuevoProducto;
}

function actualizarProducto(id, datosActualizados) {
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
        productos[index] = { ...productos[index], ...datosActualizados };
        guardarProductosEnStorage(productos);
        return true;
    }
    return false;
}

function eliminarProducto(id) {
    const index = productos.findIndex(p => p.id === id);
    if (index !== -1) {
        productos.splice(index, 1);
        guardarProductosEnStorage(productos);
        return true;
    }
    return false;
}

// Función para resetear a productos por defecto (solo admin)
function resetearProductos() {
    productos = [...PRODUCTOS_POR_DEFECTO];
    guardarProductosEnStorage(productos);
    return productos;
}

// Exportar funciones
window.ProductosDB = {
    obtenerTodos: () => [...productos],
    agregar: agregarProducto,
    actualizar: actualizarProducto,
    eliminar: eliminarProducto,
    resetear: resetearProductos,
    guardar: () => guardarProductosEnStorage(productos)
};