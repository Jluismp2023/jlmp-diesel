import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCElg_et8_Z8ERTWo5tAwZJk2tb2ztUwlc",
    authDomain: "jlmp-diesel.firebaseapp.com",
    projectId: "jlmp-diesel", // <-- VERIFIED
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
    if (!vistaLogin || !vistaApp) {
        console.error("¡ERROR CRÍTICO! 'vista-login' o 'vista-app' no encontrados al inicio.");
        return;
    }
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'block';
        if (!appInicializada) {
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
        appInicializada = false;
    }
});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) {
    let backgroundColor;
    switch (tipo) {
        case 'exito': backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)"; break;
        case 'error': backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)"; break;
        default: backgroundColor = "#007bff"; break;
    }
    Toastify({ text: texto, duration: duracion, close: true, gravity: "top", position: "right", stopOnFocus: true, style: { background: backgroundColor, } }).showToast();
}

const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null;

function abrirModal() {
    if (!modal) return;
    document.getElementById('seccionSuministro').style.display = 'none';
    document.getElementById('suministroForm').style.display = 'none';
    document.getElementById('preguntaSuministroBotones').style.display = 'block';
    document.getElementById('formularioContainer').style.display = 'block';
    document.getElementById('suministrosGuardadosLista').innerHTML = '';
    modal.style.display = 'block';
}

function cerrarModal() {
    if (modal) modal.style.display = 'none';
    reiniciarFormulario();
    cargarDatosIniciales();
}

function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        if (tabcontent[i] && tabcontent[i].style) {
             tabcontent[i].style.display = "none";
        }
    }
    tablinks = document.getElementsByClassName("main-tab-link");
     if (tablinks && tablinks.length > 0) {
        for (i = 0; i < tablinks.length; i++) {
            if (tablinks[i]) {
                 tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
        }
    }
    const tabElement = document.getElementById(tabName);
    if (tabElement && tabElement.style) {
        tabElement.style.display = "block";
    } else {
        console.error(`No se encontró el contenido de la pestaña '${tabName}' o no tiene estilo.`);
        return;
    }
    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) {
        buttonToActivate.className += " active";
    }
}

async function cargarDatosIniciales() {
    const loadingMessageElement = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    if (loaderContainer) loaderContainer.style.display = 'block';
    
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
        
        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error crítico cargando datos iniciales:", error); 
        if (loadingMessageElement) loadingMessageElement.textContent = "Error al cargar datos. Revisa la consola (F12) e intenta recargar.";
    } finally {
        if (loaderContainer) loaderContainer.style.display = 'none'; 
    }
}

function actualizarTodaLaUI() {
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();
        let consumosFiltrados = obtenerConsumosFiltrados();
        if (!Array.isArray(consumosFiltrados)) { consumosFiltrados = []; }
        let suministrosFiltrados = obtenerSuministrosFiltrados();
        if (!Array.isArray(suministrosFiltrados)) { suministrosFiltrados = []; }
        
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
    } catch (error) {
        console.error("Error actualizando la UI:", error); 
        mostrarNotificacion("Ocurrió un error al actualizar la interfaz.", "error");
    }
}

function poblarSelectores() {
    const selectoresConsumo = { 
        choferes: document.getElementById('selectChofer'), 
        placas: document.getElementById('selectVolqueta'), 
        detallesVolqueta: document.getElementById('selectDetallesVolqueta'), 
        empresas: document.getElementById('selectEmpresa'), 
        proveedores: document.getElementById('selectProveedor'), 
        proyectos: document.getElementById('selectProyecto') 
    };
    const titulosConsumo = { 
        choferes: '--- Chofer ---', placas: '--- Placa ---', detallesVolqueta: '--- Detalles Volqueta ---', 
        empresas: '--- Empresa ---', proveedores: '--- Proveedor ---', proyectos: '--- Proyecto ---' 
    };
    for (const tipo in selectoresConsumo) {
        const select = selectoresConsumo[tipo];
        if (!select || !listasAdmin[tipo]) { continue; }
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulosConsumo[tipo] || '--- Seleccione ---'}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
    const selectMaquinaria = document.getElementById('selectMaquinaria');
    const selectSuministroProyecto = document.getElementById('selectSuministroProyecto');
    if (selectMaquinaria && listasAdmin.maquinaria) {
        const valorMaquinaria = selectMaquinaria.value;
        selectMaquinaria.innerHTML = `<option value="">--- Maquinaria ---</option>`;
        listasAdmin.maquinaria.forEach(item => { selectMaquinaria.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        selectMaquinaria.value = valorMaquinaria;
    }
    if (selectSuministroProyecto && listasAdmin.proyectos) {
         const valorProyecto = selectSuministroProyecto.value;
        selectSuministroProyecto.innerHTML = `<option value="">--- Proyecto (Opcional) ---</option>`;
        listasAdmin.proyectos.forEach(item => { selectSuministroProyecto.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        selectSuministroProyecto.value = valorProyecto;
    }
}

function reiniciarFormulario() {
    const consumoForm = document.getElementById('consumoForm');
    if (consumoForm) consumoForm.reset();
    const registroIdInput = document.getElementById('registroId');
    if (registroIdInput) registroIdInput.value = '';
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.valueAsDate = new Date();
    const formularioTitulo = document.getElementById('formularioTitulo');
    if(formularioTitulo) formularioTitulo.textContent = 'Nuevo Registro';
    const suministroForm = document.getElementById('suministroForm');
    if (suministroForm) suministroForm.reset();
    const suministrosGuardadosLista = document.getElementById('suministrosGuardadosLista');
    if(suministrosGuardadosLista) suministrosGuardadosLista.innerHTML = '';
    const seccionSuministro = document.getElementById('seccionSuministro');
    if (seccionSuministro) seccionSuministro.style.display = 'none';
    if (suministroForm) suministroForm.style.display = 'none';
    const preguntaSuministroBotones = document.getElementById('preguntaSuministroBotones');
    if (preguntaSuministroBotones) preguntaSuministroBotones.style.display = 'block';
    const formularioContainer = document.getElementById('formularioContainer');
    if (formularioContainer) formularioContainer.style.display = 'block'; 
    poblarSelectores(); 
}

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
function asignarEventosApp() { /* ... (sin cambios) ... */ }

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);