import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Añadir arrayUnion
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCElg_et8_Z8ERTWo5tAwZJk2tb2ztUwlc",
    authDomain: "jlmp-diesel.firebaseapp.com",
    projectId: "jlmp-diesel",
    storageBucket: "jlmp-diesel.appspot.com",
    messagingSenderId: "763318949751",
    appId: "1:763318949751:web:e712d1008d34fbc98ab372"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let vistaLogin, vistaApp, btnLogout, modal, btnAbrirModal, btnCerrarModal; 
// ===== INICIO DE CÓDIGO NUEVO =====
let modalDistribucion, btnCerrarModalDistribucion, btnFinalizarDistribucion; 
// ===== FIN DE CÓDIGO NUEVO =====

let todosLosConsumos = [];
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;

document.addEventListener('DOMContentLoaded', () => {
    vistaLogin = document.getElementById('vista-login');
    vistaApp = document.getElementById('vista-app');
    btnLogout = document.getElementById('btn-logout');
    modal = document.getElementById('modalRegistro');
    btnAbrirModal = document.getElementById('btnAbrirModal');
    btnCerrarModal = modal ? modal.querySelector('.close-button') : null;
    // ===== INICIO DE CÓDIGO NUEVO =====
    modalDistribucion = document.getElementById('modalDistribucion');
    btnCerrarModalDistribucion = document.getElementById('cerrarModalDistribucion');
    btnFinalizarDistribucion = document.getElementById('btnFinalizarDistribucion');
    // ===== FIN DE CÓDIGO NUEVO =====


    if (!vistaLogin || !vistaApp) {
        console.error("CRITICAL ERROR!");
        document.body.innerHTML = "<h1>Error crítico. Recargue.</h1>";
        return;
    }
    
    // Configurar listener de autenticación
    onAuthStateChanged(auth, (user) => { /* ... (sin cambios) ... */ });

    // Asignar eventos iniciales
    const elLoginForm = document.getElementById('login-form');
    if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
function abrirModal() { if(modal) modal.style.display = 'block'; }
function cerrarModal() { if(modal) modal.style.display = 'none'; reiniciarFormulario(); }
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }
async function cargarDatosIniciales() { /* ... (sin cambios) ... */ }
function actualizarTodaLaUI() { /* ... (sin cambios) ... */ }
function poblarSelectores() { /* ... (sin cambios - necesita poblar selectores del nuevo modal) ... */ } // MODIFICAR LUEGO
function reiniciarFormulario() { /* ... (sin cambios - necesita reiniciar nuevo modal) ... */ } // MODIFICAR LUEGO
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios - ya llama a abrirModalDistribucion) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }
function mostrarListasAdmin() { /* ... (sin cambios) ... */ }
async function modificarItemAdmin(item, tipo) { /* ... (sin cambios) ... */ }
function cargarDatosParaModificar(id) { /* ... (sin cambios) ... */ }
function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... (sin cambios) ... */ }
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };
async function borrarItemAdmin(item, tipo) { /* ... (sin cambios) ... */ }
async function borrarConsumoHistorial(id) { /* ... (sin cambios) ... */ }
function poblarFiltroDeMes() { /* ... (sin cambios) ... */ }
function poblarFiltrosReportes() { /* ... (sin cambios) ... */ }
function mostrarHistorialAgrupado(consumos) { /* ... (sin cambios - ya tiene el botón) ... */ }
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIONES NUEVAS =====

// Abre el modal de distribución y carga la info
function abrirModalDistribucion(consumoId) {
    if (!modalDistribucion) {
        console.error("Modal de distribución no encontrado.");
        return;
    }
    const consumoOriginal = todosLosConsumos.find(c => c.id === consumoId);
    if (!consumoOriginal) {
        mostrarNotificacion("No se encontró el registro de consumo original.", "error");
        return;
    }

    // Poblar la información de la carga original
    document.getElementById('distInfoFecha').textContent = consumoOriginal.fecha;
    document.getElementById('distInfoVolqueta').textContent = consumoOriginal.volqueta;
    document.getElementById('distInfoGalonesCargados').textContent = parseFloat(consumoOriginal.galones || 0).toFixed(2);
    document.getElementById('distribucionConsumoId').value = consumoId; // Guardar ID para usar al guardar

    // Poblar selectores del modal de distribución
    const selectMaquinaria = document.getElementById('selectDistMaquinaria');
    const selectProyecto = document.getElementById('selectDistProyecto');
    if (selectMaquinaria && listasAdmin.maquinaria) {
        selectMaquinaria.innerHTML = `<option value="">--- Maquinaria ---</option>`;
        listasAdmin.maquinaria.forEach(item => { selectMaquinaria.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
    }
     if (selectProyecto && listasAdmin.proyectos) {
        selectProyecto.innerHTML = `<option value="">--- Proyecto (Opcional) ---</option>`;
        listasAdmin.proyectos.forEach(item => { selectProyecto.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
    }
    
    // Limpiar formulario y lista
    document.getElementById('distribucionForm').reset();
    document.getElementById('distribucionesAnterioresLista').innerHTML = '';

    // Calcular y mostrar galones ya distribuidos y restantes
    actualizarInfoDistribucionModal(consumoOriginal);

    modalDistribucion.style.display = 'block';
}

// Cierra el modal de distribución
function cerrarModalDistribucion() {
    if (modalDistribucion) {
        modalDistribucion.style.display = 'none';
        // Podríamos recargar los datos aquí si queremos ver los cambios en el historial inmediatamente
        cargarDatosIniciales(); 
    }
}

// Calcula y actualiza la info de galones en el modal
function actualizarInfoDistribucionModal(consumo) {
    const distribuciones = consumo.distribuciones || []; // Asegura que sea un array
    const galonesDistribuidos = distribuciones.reduce((sum, dist) => sum + (parseFloat(dist.galones) || 0), 0);
    const galonesCargados = parseFloat(consumo.galones || 0);
    const galonesRestantes = galonesCargados - galonesDistribuidos;

    document.getElementById('distInfoGalonesDistribuidos').textContent = galonesDistribuidos.toFixed(2);
    document.getElementById('distInfoGalonesRestantes').textContent = galonesRestantes.toFixed(2);

    // Actualiza la lista de distribuciones anteriores
    const listaUl = document.getElementById('distribucionesAnterioresLista');
    listaUl.innerHTML = ''; // Limpiar lista
    if(distribuciones.length === 0){
        listaUl.innerHTML = '<li>Aún no hay distribuciones registradas para esta carga.</li>';
    } else {
        distribuciones.forEach(dist => {
            const li = document.createElement('li');
            li.textContent = `- ${dist.galones} gal a ${dist.maquina} ${dist.proyecto ? '('+dist.proyecto+')' : ''} ${dist.descripcion ? ': '+dist.descripcion : ''}`;
            listaUl.appendChild(li);
        });
    }
}

// Guarda una nueva distribución en el array del documento original
async function guardarDistribucion(e) {
    e.preventDefault();
    const btnGuardarDist = document.getElementById('btnGuardarDistribucion');
    btnGuardarDist.disabled = true;
    btnGuardarDist.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const consumoId = document.getElementById('distribucionConsumoId').value;
    const consumoOriginal = todosLosConsumos.find(c => c.id === consumoId); // Obtener datos actuales
    
    if (!consumoOriginal) {
        mostrarNotificacion("Error: No se encontró el registro de consumo original.", "error");
         btnGuardarDist.disabled = false;
         btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
        return;
    }

    const galonesASuministrar = parseFloat(document.getElementById('distGalonesSuministrados').value);
    const distribucionesActuales = consumoOriginal.distribuciones || [];
    const galonesYaDistribuidos = distribucionesActuales.reduce((sum, dist) => sum + (parseFloat(dist.galones) || 0), 0);
    const galonesCargados = parseFloat(consumoOriginal.galones || 0);
    const galonesRestantes = galonesCargados - galonesYaDistribuidos;

    if (isNaN(galonesASuministrar) || galonesASuministrar <= 0) {
         mostrarNotificacion("Ingrese una cantidad válida de galones a suministrar.", "error");
         btnGuardarDist.disabled = false;
         btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
         return;
    }
    
    // Validar que no se distribuya más de lo disponible
    if (galonesASuministrar > galonesRestantes) {
        mostrarNotificacion(`No puede distribuir ${galonesASuministrar.toFixed(2)} gal. Solo quedan ${galonesRestantes.toFixed(2)} gal disponibles de esta carga.`, "error", 5000);
        btnGuardarDist.disabled = false;
        btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
        return;
    }

    const nuevaDistribucion = {
        maquina: document.getElementById('selectDistMaquinaria').value,
        galones: galonesASuministrar.toFixed(2), // Guardar como string con 2 decimales
        proyecto: document.getElementById('selectDistProyecto').value || "",
        descripcion: document.getElementById('distDescripcion').value || "",
        fechaRegistro: new Date().toISOString() // Opcional: guardar cuándo se registró esta distribución específica
    };

    if (!nuevaDistribucion.maquina) {
        mostrarNotificacion("Seleccione la maquinaria receptora.", "error");
         btnGuardarDist.disabled = false;
         btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
        return;
    }

    try {
        const consumoDocRef = doc(db, "consumos", consumoId);
        // Usar arrayUnion para añadir el nuevo objeto al array 'distribuciones'
        await updateDoc(consumoDocRef, {
            distribuciones: arrayUnion(nuevaDistribucion)
        });

        mostrarNotificacion("Distribución guardada con éxito.", "exito");
        
        // Actualizar localmente para reflejar en el modal inmediatamente
        const index = todosLosConsumos.findIndex(c => c.id === consumoId);
        if (index !== -1) {
            if (!todosLosConsumos[index].distribuciones) {
                todosLosConsumos[index].distribuciones = [];
            }
            todosLosConsumos[index].distribuciones.push(nuevaDistribucion);
            actualizarInfoDistribucionModal(todosLosConsumos[index]); // Actualiza la info y la lista en el modal
        }
        
        // Limpiar el formulario para posible nueva entrada
        document.getElementById('distribucionForm').reset();
        document.getElementById('selectDistMaquinaria').focus();

    } catch (error) {
        console.error("Error al guardar distribución:", error);
        mostrarNotificacion("No se pudo guardar la distribución.", "error");
    } finally {
        btnGuardarDist.disabled = false;
        btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
    }
}

// ===== FIN DE FUNCIONES NUEVAS =====


function asignarEventosApp() {
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    
    // ===== INICIO DE CÓDIGO NUEVO =====
    // Eventos para el nuevo modal de distribución
    if (btnCerrarModalDistribucion) btnCerrarModalDistribucion.addEventListener('click', cerrarModalDistribucion);
    if (btnFinalizarDistribucion) btnFinalizarDistribucion.addEventListener('click', cerrarModalDistribucion);
    const formDistribucion = document.getElementById('distribucionForm');
    if (formDistribucion) formDistribucion.addEventListener('submit', guardarDistribucion);
    // ===== FIN DE CÓDIGO NUEVO =====
    
    const btnReg = document.getElementById('btnTabRegistrar'); if(btnReg) btnReg.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    const btnRep = document.getElementById('btnTabReportes'); if(btnRep) btnRep.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    const btnHist = document.getElementById('btnTabHistorial'); if(btnHist) btnHist.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    const btnAdm = document.getElementById('btnTabAdmin'); if(btnAdm) btnAdm.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    const consumoForm = document.getElementById('consumoForm'); if(consumoForm) consumoForm.addEventListener('submit', guardarOActualizar);

    document.querySelectorAll('.btn-print').forEach(btn => { btn.addEventListener('click', (e) => { /* ... */ }); });
    window.onafterprint = () => { /* ... */ };
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => { /* ... */ }));
    
    const histBody = document.getElementById('historialBody'); if(histBody) histBody.addEventListener('click', manejarAccionesHistorial);
    
    // Forms Admin
    const formChofer = document.getElementById('formAdminChofer'); if(formChofer) formChofer.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    const formPlaca = document.getElementById('formAdminPlaca'); if(formPlaca) formPlaca.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    const formDetalles = document.getElementById('formAdminDetallesVolqueta'); if(formDetalles) formDetalles.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); }); 
    const formMaquinaria = document.getElementById('formAdminMaquinaria'); if(formMaquinaria) formMaquinaria.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('maquinaria', document.getElementById('nuevaMaquinaria')); }); 
    const formEmpresa = document.getElementById('formAdminEmpresa'); if(formEmpresa) formEmpresa.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    const formProveedor = document.getElementById('formAdminProveedor'); if(formProveedor) formProveedor.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    const formProyecto = document.getElementById('formAdminProyecto'); if(formProyecto) formProyecto.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => { boton.addEventListener('click', function() { /* ... */ }); });
    asignarSincronizacionDeFiltros();
}

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}