import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

const vistaLogin = document.getElementById('vista-login');
const vistaApp = document.getElementById('vista-app');
const btnLogout = document.getElementById('btn-logout');

let todosLosConsumos = [];
let todosLosSuministros = []; 
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;

onAuthStateChanged(auth, (user) => {
    console.log("Estado de autenticación cambiado. Usuario:", user ? user.email : 'Ninguno'); // Diagnóstico
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        btnLogout.style.display = 'block';
        if (!appInicializada) {
            console.log("Usuario autenticado, iniciando aplicación..."); // Diagnóstico
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        console.log("Usuario no autenticado, mostrando login."); // Diagnóstico
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        btnLogout.style.display = 'none';
        appInicializada = false;
    }
});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null; // Añadida verificación
function abrirModal() { /* ... (sin cambios) ... */ }
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); } 
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }

async function cargarDatosIniciales() {
    console.log("Iniciando carga de datos iniciales..."); // Diagnóstico
    const loadingMessageElement = document.getElementById('loadingMessage');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    
    try {
        const collectionsToLoad = [
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "suministros"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))), 
            getDocs(query(collection(db, "maquinaria"), orderBy("nombre"))), 
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ];
        
        const results = await Promise.all(collectionsToLoad);
        
        todosLosConsumos = results[0].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        todosLosSuministros = results[1].docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.choferes = results[2].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = results[3].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = results[4].docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.maquinaria = results[5].docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.empresas = results[6].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proveedores = results[7].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proyectos = results[8].docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        console.log("Datos cargados:", { // Diagnóstico
            consumos: todosLosConsumos.length,
            suministros: todosLosSuministros.length,
            listasAdmin 
        });

        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error crítico cargando datos iniciales:", error); // Diagnóstico más detallado
        if (loadingMessageElement) loadingMessageElement.textContent = "Error al cargar datos. Revisa la consola (F12) e intenta recargar.";
    } finally {
        const loaderContainer = document.getElementById('loaderContainer');
        if (loaderContainer) loaderContainer.style.display = 'none'; 
    }
}

function actualizarTodaLaUI() {
    console.log("Actualizando toda la UI..."); // Diagnóstico
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();
        const consumosFiltrados = obtenerConsumosFiltrados();
        const suministrosFiltrados = obtenerSuministrosFiltrados(); 
        
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
        console.log("UI actualizada correctamente."); // Diagnóstico
    } catch (error) {
        console.error("Error actualizando la UI:", error); // Diagnóstico más detallado
        mostrarNotificacion("Ocurrió un error al actualizar la interfaz.", "error");
    }
}

function poblarSelectores() { /* ... (sin cambios, ya tiene verificaciones) ... */ }
function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarSuministro(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }
function obtenerSuministrosFiltrados() { /* ... (sin cambios) ... */ }

function mostrarListasAdmin() { 
    console.log("Intentando mostrar listas de administración..."); // Diagnóstico
    /* ... (resto de la función sin cambios, ya tiene verificaciones) ... */ 
}
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

function mostrarHistorialAgrupado(consumos) { 
    console.log(`Intentando mostrar historial agrupado con ${consumos.length} registros.`); // Diagnóstico
    /* ... (resto de la función sin cambios) ... */ 
}
function mostrarHistorialSuministros(suministros) { 
    console.log(`Intentando mostrar historial de suministros con ${suministros.length} registros.`); // Diagnóstico
     /* ... (resto de la función sin cambios) ... */ 
}
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios, ya tiene verificaciones) ... */ }

function iniciarAplicacion() {
    console.log("Llamando a asignarEventosApp y cargarDatosIniciales."); // Diagnóstico
    asignarEventosApp();
    cargarDatosIniciales();
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);

console.log("Script cargado y eventos iniciales asignados."); // Diagnóstico final