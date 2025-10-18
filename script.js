import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ... (firebaseConfig, app, db, auth, variables globales, onAuthStateChanged - sin cambios) ...
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let vistaLogin, vistaApp, btnLogout, modal, btnAbrirModal, btnCerrarModal;
try { /* ... verificaciones iniciales ... */ } catch (error) { /* ... */ }
let todosLosConsumos = [];
let todosLosSuministros = [];
let listasAdmin = { /* ... */ };
let appInicializada = false;
let tabActivaParaImprimir = null;
onAuthStateChanged(auth, (user) => { /* ... */ });


function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
function abrirModal() { /* ... (sin cambios) ... */ }
function cerrarModal() { /* ... (sin cambios) ... */ }
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }
async function cargarDatosIniciales() { /* ... (sin cambios, con logs) ... */ }
function actualizarTodaLaUI() { /* ... (sin cambios, con logs y verificaciones) ... */ }
function poblarSelectores() { /* ... (sin cambios, con verificaciones) ... */ }
function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarSuministro(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios, con try/catch) ... */ }
function obtenerSuministrosFiltrados() { /* ... (sin cambios, con try/catch) ... */ }
function mostrarListasAdmin() { /* ... (sin cambios, con verificaciones) ... */ }
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
function mostrarHistorialAgrupado(consumos) { /* ... (sin cambios, con verificaciones) ... */ }
function mostrarHistorialSuministros(suministros) { /* ... (sin cambios, con verificaciones) ... */ }
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios, con logs detallados) ... */ }


// ===== INICIO DE FUNCIÓN MODIFICADA (Orden cambiado) =====
function iniciarAplicacion() {
    console.log("Ejecutando iniciarAplicacion...");
    console.log("Llamando a cargarDatosIniciales PRIMERO..."); // Log cambiado
    cargarDatosIniciales(); // Llamar primero a cargar datos
    console.log("Llamando a asignarEventosApp DESPUÉS..."); // Log cambiado
    asignarEventosApp(); // Llamar después a asignar eventos
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
else console.warn("Elemento 'login-form' no encontrado al asignar evento inicial.");

if (btnLogout) { btnLogout.addEventListener('click', handleLogout); }

console.log("Script cargado y verificación inicial de elementos completada.");