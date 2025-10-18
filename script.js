import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ... (firebaseConfig, app, db, auth - sin cambios) ...
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


// ===== INICIO DE CÓDIGO MODIFICADO =====
const vistaLogin = document.getElementById('vista-login');
const vistaApp = document.getElementById('vista-app');
const btnLogout = document.getElementById('btn-logout');

// Verificar si los elementos principales existen al cargar el script
console.log("Verificando elementos principales al inicio:");
if (!vistaLogin) console.error("¡ERROR CRÍTICO! Elemento 'vista-login' no encontrado.");
else console.log("Elemento 'vista-login' encontrado.");

if (!vistaApp) console.error("¡ERROR CRÍTICO! Elemento 'vista-app' no encontrado.");
else console.log("Elemento 'vista-app' encontrado.");

if (!btnLogout) console.warn("Elemento 'btn-logout' no encontrado (puede ser normal si el usuario no está logueado).");
else console.log("Elemento 'btn-logout' encontrado.");
// ===== FIN DE CÓDIGO MODIFICADO =====

let todosLosConsumos = [];
let todosLosSuministros = [];
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;

onAuthStateChanged(auth, (user) => {
    console.log("onAuthStateChanged ejecutado. Usuario:", user ? user.email : 'Ninguno');

    // ===== INICIO DE CÓDIGO MODIFICADO (Verificaciones dentro del listener) =====
    // Re-verificar los elementos DENTRO del listener, por si acaso
    if (!vistaLogin) {
        console.error("¡ERROR dentro de onAuthStateChanged! 'vista-login' es null.");
        return; // Detener ejecución si falta un elemento crítico
    }
     if (!vistaApp) {
        console.error("¡ERROR dentro de onAuthStateChanged! 'vista-app' es null.");
        return; // Detener ejecución si falta un elemento crítico
    }
    // ===== FIN DE CÓDIGO MODIFICADO =====

    if (user) {
        console.log("Usuario detectado, mostrando vista de app...");
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'block';
        else console.warn("btnLogout no encontrado al intentar mostrarlo.");

        if (!appInicializada) {
            console.log("Usuario autenticado Y app no inicializada, llamando a iniciarAplicacion...");
            iniciarAplicacion();
            appInicializada = true;
        } else {
             console.log("Usuario autenticado PERO app ya inicializada.");
        }
    } else {
        console.log("Usuario NO detectado, mostrando vista de login...");
        vistaLogin.style.display = 'block'; // Asegurarse que se muestre
        vistaApp.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
        else console.warn("btnLogout no encontrado al intentar ocultarlo.");
        appInicializada = false;
    }
});

// ... (Resto de funciones: mostrarNotificacion, abrirModal, cerrarModal, openMainTab, etc. SIN CAMBIOS) ...
function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... */ }
const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null;
function abrirModal() { /* ... */ }
function cerrarModal() { if (modal) modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); }
function openMainTab(evt, tabName) { /* ... */ }
async function cargarDatosIniciales() { /* ... */ }
function actualizarTodaLaUI() { /* ... */ }
function poblarSelectores() { /* ... */ }
function reiniciarFormulario() { /* ... */ }
async function guardarOActualizar(e) { /* ... */ }
async function guardarSuministro(e) { /* ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... */ }
function manejarAccionesHistorial(e) { /* ... */ }
function obtenerConsumosFiltrados() { /* ... */ }
function obtenerSuministrosFiltrados() { /* ... */ }
function mostrarListasAdmin() { /* ... */ }
async function modificarItemAdmin(item, tipo) { /* ... */ }
function cargarDatosParaModificar(id) { /* ... */ }
function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... */ }
function calcularYMostrarSuministrosPorVolqueta(suministros) { /* ... */ }
function calcularYMostrarSuministrosPorMaquinaria(suministros) { /* ... */ }
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };
async function borrarItemAdmin(item, tipo) { /* ... */ }
async function borrarConsumoHistorial(id) { /* ... */ }
function poblarFiltroDeMes() { /* ... */ }
function poblarFiltrosReportes() { /* ... */ }
function mostrarHistorialAgrupado(consumos) { /* ... */ }
function mostrarHistorialSuministros(suministros) { /* ... */ }
function asignarSincronizacionDeFiltros() { /* ... */ }
function handleLogin(e) { /* ... */ }
function handleLogout() { /* ... */ }
function asignarEventosApp() { /* ... */ }


function iniciarAplicacion() {
    console.log("Ejecutando iniciarAplicacion..."); // Log al inicio
    asignarEventosApp();
    cargarDatosIniciales();
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
else console.warn("Elemento 'login-form' no encontrado al asignar evento inicial.");

if (btnLogout) btnLogout.addEventListener('click', handleLogout);
else console.warn("Elemento 'btn-logout' no encontrado al asignar evento inicial.");

// console.log("Script cargado y eventos iniciales asignados."); // Movido más arriba