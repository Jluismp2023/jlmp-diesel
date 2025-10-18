import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ... (firebaseConfig, app, db, auth, variables globales, onAuthStateChanged - sin cambios) ...
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let vistaLogin, vistaApp, btnLogout, modal, btnAbrirModal, btnCerrarModal;
// Inicializar referencias aquí para asegurar que estén disponibles
vistaLogin = document.getElementById('vista-login');
vistaApp = document.getElementById('vista-app');
btnLogout = document.getElementById('btn-logout');
modal = document.getElementById('modalRegistro');
btnAbrirModal = document.getElementById('btnAbrirModal');
btnCerrarModal = modal ? modal.querySelector('.close-button') : null;
let todosLosConsumos = [];
let todosLosSuministros = [];
let listasAdmin = { /* ... */ };
let appInicializada = false;
let tabActivaParaImprimir = null;
onAuthStateChanged(auth, (user) => { /* ... (sin cambios) ... */ });

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function abrirModal() {
    console.log("Función abrirModal llamada."); // <-- NUEVO LOG
    if (!modal) {
        console.error("El elemento del modal no fue encontrado.");
        return;
    }
    // Resto de la función sin cambios...
    document.getElementById('seccionSuministro').style.display = 'none';
    document.getElementById('suministroForm').style.display = 'none';
    document.getElementById('preguntaSuministroBotones').style.display = 'block';
    document.getElementById('formularioContainer').style.display = 'block';
    document.getElementById('suministrosGuardadosLista').innerHTML = '';
    modal.style.display = 'block';
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function cerrarModal() { if (modal) modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function openMainTab(evt, tabName) {
    console.log(`Función openMainTab llamada para: ${tabName}`); // <-- NUEVO LOG
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    // Verificar si se encontraron elementos
    if (!tabcontent || tabcontent.length === 0) {
        console.error("No se encontraron elementos 'main-tab-content'.");
        return;
    }
    console.log(`Ocultando ${tabcontent.length} contenidos de pestaña...`); // Log
    for (i = 0; i < tabcontent.length; i++) {
        // Añadir verificación por si el elemento no tiene 'style'
        if (tabcontent[i] && tabcontent[i].style) {
             tabcontent[i].style.display = "none";
        } else {
             console.warn(`Elemento tabcontent[${i}] inválido o sin estilo.`);
        }
    }

    tablinks = document.getElementsByClassName("main-tab-link");
     if (!tablinks || tablinks.length === 0) {
        console.error("No se encontraron elementos 'main-tab-link'.");
        // Continuar de todos modos para intentar mostrar el contenido
    } else {
        console.log(`Reseteando ${tablinks.length} enlaces de pestaña...`); // Log
        for (i = 0; i < tablinks.length; i++) {
            if (tablinks[i]) { // Verificar si el elemento existe
                 tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
        }
    }

    const tabElement = document.getElementById(tabName);
    if (tabElement && tabElement.style) { // Verificar si existe y tiene estilo
        console.log(`Mostrando contenido de la pestaña: ${tabName}`); // Log
        tabElement.style.display = "block";
    } else {
        console.error(`No se encontró el contenido de la pestaña '${tabName}' o no tiene estilo.`);
        return; // Salir si no se puede mostrar el contenido
    }

    // Activar el botón correcto
    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) {
        console.log(`Activando botón para: ${tabName}`); // Log
        buttonToActivate.className += " active";
    } else {
         console.warn(`No se encontró el botón para activar para la pestaña: ${tabName}`);
    }
     console.log(`openMainTab para '${tabName}' completado.`); // Log final
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


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
function asignarEventosApp() { /* ... (sin cambios, ya tiene logs detallados) ... */ }
function iniciarAplicacion() { /* ... (sin cambios) ... */ }

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);

console.log("Script cargado y verificación inicial de elementos completada.");