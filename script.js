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
    // console.log("Estado de autenticación cambiado. Usuario:", user ? user.email : 'Ninguno');
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'block';
        if (!appInicializada) {
            // console.log("Usuario autenticado, iniciando aplicación...");
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        // console.log("Usuario no autenticado, mostrando login.");
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
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

// ===== INICIO DE FUNCIÓN MODIFICADA (Verificaciones robustas) =====
function actualizarTodaLaUI() {
    console.log("Actualizando toda la UI...");
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();

        // --- VERIFICACIÓN ROBUSTA ---
        let consumosFiltrados = obtenerConsumosFiltrados();
        if (!Array.isArray(consumosFiltrados)) {
            console.error("¡ALERTA! obtenerConsumosFiltrados no devolvió un array! Valor:", consumosFiltrados);
            consumosFiltrados = []; // Forzar array vacío para evitar error fatal
        }
        console.log(`Consumos filtrados: ${consumosFiltrados.length}`);

        let suministrosFiltrados = obtenerSuministrosFiltrados();
        if (!Array.isArray(suministrosFiltrados)) {
            console.error("¡ALERTA! obtenerSuministrosFiltrados no devolvió un array! Valor:", suministrosFiltrados);
            suministrosFiltrados = []; // Forzar array vacío
        }
        console.log(`Suministros filtrados: ${suministrosFiltrados.length}`);
        // --- FIN VERIFICACIÓN ROBUSTA ---
        
        calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
        calcularYMostrarTotalesPorProveedor(consumosFiltrados);
        calcularYMostrarTotalesPorProyecto(consumosFiltrados);
        calcularYMostrarTotalesPorChofer(consumosFiltrados);
        calcularYMostrarTotales(consumosFiltrados); 

        calcularYMostrarSuministrosPorVolqueta(suministrosFiltrados);
        calcularYMostrarSuministrosPorMaquinaria(suministrosFiltrados);

        poblarSelectores();
        mostrarListasAdmin();
        
        mostrarHistorialAgrupado(consumosFiltrados);
        mostrarHistorialSuministros(suministrosFiltrados); 
        console.log("UI actualizada correctamente."); 
    } catch (error) {
        console.error("Error actualizando la UI:", error); 
        mostrarNotificacion("Ocurrió un error al actualizar la interfaz.", "error");
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


function poblarSelectores() { /* ... (sin cambios) ... */ }
function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarSuministro(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA (Verificación robusta del selector) =====
function obtenerConsumosFiltrados() {
    try { // Añadir try...catch para aislar errores aquí
        const obtenerValorFiltro = (syncId) => {
            const elemento = document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
            if (!elemento) {
                console.error(`Elemento de filtro no encontrado para syncId: ${syncId}`);
                // Devolver valor por defecto seguro
                return (syncId.startsWith('filtroFecha')) ? '' : 'todos';
            }
            return elemento.value;
        };
        const mes = obtenerValorFiltro('filtroMes');
        const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
        const fechaFin = obtenerValorFiltro('filtroFechaFin');
        const chofer = obtenerValorFiltro('filtroChofer');
        const proveedor = obtenerValorFiltro('filtroProveedor');
        const empresa = obtenerValorFiltro('filtroEmpresa');
        const proyecto = obtenerValorFiltro('filtroProyecto');
        
        let consumosFiltrados = todosLosConsumos; // Empezar con todos

        // Aplicar filtros... (lógica sin cambios)
        if (fechaInicio && fechaFin) { if (fechaFin < fechaInicio) { mostrarNotificacion("La fecha de fin no puede ser anterior a la de inicio.", "error"); return []; } consumosFiltrados = consumosFiltrados.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin); } else if (fechaInicio) { consumosFiltrados = consumosFiltrados.filter(c => c.fecha === fechaInicio); } else if (mes !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.fecha && c.fecha.startsWith(mes)); } // Añadir c.fecha &&
        if (chofer !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.chofer === chofer); }
        if (proveedor !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proveedor === proveedor); }
        if (empresa !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.empresa === empresa); }
        if (proyecto !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proyecto === proyecto); }
        
        return consumosFiltrados; // Asegurarse de que siempre devuelve un array
    } catch (error) {
        console.error("Error dentro de obtenerConsumosFiltrados:", error);
        return []; // Devolver array vacío en caso de error
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

// ===== INICIO DE FUNCIÓN MODIFICADA (Verificación robusta del selector) =====
function obtenerSuministrosFiltrados() {
     try { // Añadir try...catch
        const obtenerValorFiltro = (syncId) => {
             const elemento = document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
            if (!elemento) {
                console.error(`Elemento de filtro no encontrado para syncId: ${syncId}`);
                return (syncId.startsWith('filtroFecha')) ? '' : 'todos';
            }
            return elemento.value;
        };
        const mes = obtenerValorFiltro('filtroMes');
        const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
        const fechaFin = obtenerValorFiltro('filtroFechaFin');
        const proyecto = obtenerValorFiltro('filtroProyecto'); 

        let suministrosFiltrados = todosLosSuministros;

        // Aplicar filtros... (lógica sin cambios)
        if (fechaInicio && fechaFin) { if (fechaFin < fechaInicio) { return []; } suministrosFiltrados = suministrosFiltrados.filter(s => s.fecha >= fechaInicio && s.fecha <= fechaFin); } else if (fechaInicio) { suministrosFiltrados = suministrosFiltrados.filter(s => s.fecha === fechaInicio); } else if (mes !== 'todos') { suministrosFiltrados = suministrosFiltrados.filter(s => s.fecha && s.fecha.startsWith(mes)); } // Añadir s.fecha &&
        if (proyecto !== 'todos') { suministrosFiltrados = suministrosFiltrados.filter(s => s.proyecto === proyecto); }
        
        return suministrosFiltrados;
    } catch (error) {
        console.error("Error dentro de obtenerSuministrosFiltrados:", error);
        return []; // Devolver array vacío en caso de error
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


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
function mostrarHistorialAgrupado(consumos) { /* ... (sin cambios, ya tiene verificaciones) ... */ }
function mostrarHistorialSuministros(suministros) { /* ... (sin cambios, ya tiene verificaciones) ... */ }
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios, ya tiene verificaciones) ... */ }
function iniciarAplicacion() { /* ... (sin cambios) ... */ }

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);

// console.log("Script cargado y eventos iniciales asignados.");