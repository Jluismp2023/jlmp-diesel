import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ... (firebaseConfig, app, db, auth, variables globales - sin cambios) ...
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

const vistaLogin = document.getElementById('vista-login');
const vistaApp = document.getElementById('vista-app');
const btnLogout = document.getElementById('btn-logout');

let todosLosConsumos = [];
let todosLosSuministros = [];
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;


onAuthStateChanged(auth, (user) => {
    console.log("Estado de autenticación cambiado. Usuario:", user ? user.email : 'Ninguno');
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'block'; // Verificar si existe
        if (!appInicializada) {
            console.log("Usuario autenticado, iniciando aplicación...");
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        console.log("Usuario no autenticado, mostrando login.");
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none'; // Verificar si existe
        appInicializada = false;
    }
});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null;
function abrirModal() { /* ... (sin cambios) ... */ }
function cerrarModal() { if (modal) modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); }
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }
async function cargarDatosIniciales() { /* ... (sin cambios) ... */ }
function actualizarTodaLaUI() { /* ... (sin cambios) ... */ }
function poblarSelectores() { /* ... (sin cambios) ... */ }
function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarSuministro(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }
function obtenerSuministrosFiltrados() { /* ... (sin cambios) ... */ }
function mostrarListasAdmin() { /* ... (sin cambios) ... */ }
async function modificarItemAdmin(item, tipo) { /* ... (sin cambios) ... */ }
function cargarDatosParaModificar(id) { /* ... (sin cambios) ... */ }
function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... (sin cambios) ... */ }
function calcularYMostrarSuministrosPorVolqueta(suministros) { /* ... (sin cambios) ... */ }
function calcularYMostrarSuministrosPorMaquinaria(suministros) { /* ... (sin cambios) ... */ }
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };
async function borrarItemAdmin(item, tipo) { /* ... (sin cambios) ... */ }
async function borrarConsumoHistorial(id) { /* ... (sin cambios) ... */ }
function poblarFiltroDeMes() { /* ... (sin cambios) ... */ }
function poblarFiltrosReportes() { /* ... (sin cambios) ... */ }
function mostrarHistorialAgrupado(consumos) { /* ... (sin cambios) ... */ }
function mostrarHistorialSuministros(suministros) { /* ... (sin cambios) ... */ }
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }


// ===== INICIO DE FUNCIÓN MODIFICADA (CON LOGS DETALLADOS) =====
function asignarEventosApp() {
    console.log("Iniciando asignarEventosApp..."); // Log inicial

    try {
        const elBtnAbrirModal = document.getElementById('btnAbrirModal');
        if (elBtnAbrirModal) elBtnAbrirModal.addEventListener('click', abrirModal);
        else console.warn("Elemento no encontrado: btnAbrirModal");
        console.log("Evento asignado a btnAbrirModal (si existe)");

        const elBtnCerrarModal = modal ? modal.querySelector('.close-button') : null;
        if (elBtnCerrarModal) elBtnCerrarModal.addEventListener('click', cerrarModal);
        else console.warn("Elemento no encontrado: .close-button dentro de modalRegistro");
        console.log("Evento asignado a btnCerrarModal (si existe)");
        
        const elBtnTabRegistrar = document.getElementById('btnTabRegistrar');
        if (elBtnTabRegistrar) elBtnTabRegistrar.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
        else console.warn("Elemento no encontrado: btnTabRegistrar");
        console.log("Evento asignado a btnTabRegistrar (si existe)");
        
        const elBtnTabReportes = document.getElementById('btnTabReportes');
        if (elBtnTabReportes) elBtnTabReportes.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
        else console.warn("Elemento no encontrado: btnTabReportes");
        console.log("Evento asignado a btnTabReportes (si existe)");
        
        const elBtnTabHistorial = document.getElementById('btnTabHistorial');
        if (elBtnTabHistorial) elBtnTabHistorial.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
        else console.warn("Elemento no encontrado: btnTabHistorial");
        console.log("Evento asignado a btnTabHistorial (si existe)");
        
        const elBtnTabAdmin = document.getElementById('btnTabAdmin');
        if (elBtnTabAdmin) elBtnTabAdmin.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
        else console.warn("Elemento no encontrado: btnTabAdmin");
        console.log("Evento asignado a btnTabAdmin (si existe)");
        
        const elConsumoForm = document.getElementById('consumoForm');
        if (elConsumoForm) elConsumoForm.addEventListener('submit', guardarOActualizar);
        else console.warn("Elemento no encontrado: consumoForm");
        console.log("Evento asignado a consumoForm (si existe)");

        // Eventos Suministro
        const elBtnSiSuministro = document.getElementById('btnSiSuministro');
        if (elBtnSiSuministro) elBtnSiSuministro.addEventListener('click', () => { /* ... */ });
        else console.warn("Elemento no encontrado: btnSiSuministro");
        console.log("Evento asignado a btnSiSuministro (si existe)");
        
        const elBtnNoSuministro = document.getElementById('btnNoSuministro');
        if (elBtnNoSuministro) elBtnNoSuministro.addEventListener('click', cerrarModal);
        else console.warn("Elemento no encontrado: btnNoSuministro");
        console.log("Evento asignado a btnNoSuministro (si existe)");
        
        const elSuministroForm = document.getElementById('suministroForm');
        if (elSuministroForm) elSuministroForm.addEventListener('submit', guardarSuministro);
        else console.warn("Elemento no encontrado: suministroForm");
        console.log("Evento asignado a suministroForm (si existe)");

        const elBtnFinalizarSuministro = document.getElementById('btnFinalizarSuministro');
        if (elBtnFinalizarSuministro) elBtnFinalizarSuministro.addEventListener('click', cerrarModal);
        else console.warn("Elemento no encontrado: btnFinalizarSuministro");
        console.log("Evento asignado a btnFinalizarSuministro (si existe)");

        // Eventos Impresión y Filtros
        document.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', (e) => { /* ... */ }));
        console.log("Eventos asignados a botones .btn-print");
        
        window.onafterprint = () => { /* ... */ };
        console.log("Evento onafterprint asignado");
        
        document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
        console.log("Eventos asignados a botones #btnAplicarFiltros");
        
        document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => { /* ... */ }));
        console.log("Eventos asignados a botones #btnLimpiarFiltros");
        
        const elHistorialBody = document.getElementById('historialBody');
        if (elHistorialBody) elHistorialBody.addEventListener('click', manejarAccionesHistorial);
        else console.warn("Elemento no encontrado: historialBody");
        console.log("Evento asignado a historialBody (si existe)");

        // Eventos Forms Admin
        const elFormAdminChofer = document.getElementById('formAdminChofer');
        if (elFormAdminChofer) elFormAdminChofer.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminChofer");
        console.log("Evento asignado a formAdminChofer (si existe)");
        
        const elFormAdminPlaca = document.getElementById('formAdminPlaca');
        if (elFormAdminPlaca) elFormAdminPlaca.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminPlaca");
        console.log("Evento asignado a formAdminPlaca (si existe)");
        
        const elFormAdminDetalles = document.getElementById('formAdminDetallesVolqueta');
        if (elFormAdminDetalles) elFormAdminDetalles.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminDetallesVolqueta");
        console.log("Evento asignado a formAdminDetallesVolqueta (si existe)");
        
        const elFormAdminMaquinaria = document.getElementById('formAdminMaquinaria');
        if (elFormAdminMaquinaria) elFormAdminMaquinaria.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminMaquinaria");
        console.log("Evento asignado a formAdminMaquinaria (si existe)");
        
        const elFormAdminEmpresa = document.getElementById('formAdminEmpresa');
        if (elFormAdminEmpresa) elFormAdminEmpresa.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminEmpresa");
        console.log("Evento asignado a formAdminEmpresa (si existe)");
        
        const elFormAdminProveedor = document.getElementById('formAdminProveedor');
        if (elFormAdminProveedor) elFormAdminProveedor.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminProveedor");
        console.log("Evento asignado a formAdminProveedor (si existe)");
        
        const elFormAdminProyecto = document.getElementById('formAdminProyecto');
        if (elFormAdminProyecto) elFormAdminProyecto.addEventListener('submit', (e) => { /* ... */ });
        else console.warn("Elemento no encontrado: formAdminProyecto");
        console.log("Evento asignado a formAdminProyecto (si existe)");
        
        const botonesAcordeon = document.querySelectorAll('.accordion-button');
        botonesAcordeon.forEach(boton => { /* ... */ });
        console.log("Eventos asignados a botones .accordion-button");
        
        asignarSincronizacionDeFiltros();
        console.log("Sincronización de filtros asignada.");
        
        console.log("asignarEventosApp completado sin errores aparentes."); // Log final
    } catch (error) {
        console.error("Error FATAL dentro de asignarEventosApp:", error); // Captura errores dentro de la función
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function iniciarAplicacion() {
    console.log("Llamando a asignarEventosApp..."); // Log antes
    asignarEventosApp();
    console.log("Llamando a cargarDatosIniciales..."); // Log antes
    cargarDatosIniciales();
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);

console.log("Script cargado y eventos iniciales asignados.");