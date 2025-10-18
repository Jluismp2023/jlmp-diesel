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
let todosLosSuministros = []; // <-- Nueva variable global para suministros
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        btnLogout.style.display = 'block';
        if (!appInicializada) {
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        btnLogout.style.display = 'none';
        appInicializada = false;
    }
});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal.querySelector('.close-button');
function abrirModal() { /* ... (sin cambios) ... */ }
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); } // <- Llama a cargarDatosIniciales al cerrar
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA (Carga también suministros) =====
async function cargarDatosIniciales() {
    document.getElementById('loadingMessage').style.display = 'block';
    try {
        const [
            consumosRes, suministrosRes, // Añadir suministrosRes
            choferesRes, placasRes, detallesVolquetaRes, maquinariaRes, 
            empresasRes, proveedoresRes, proyectosRes
        ] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "suministros"), orderBy("fecha", "desc"))), // Cargar nueva colección
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))), 
            getDocs(query(collection(db, "maquinaria"), orderBy("nombre"))), 
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        todosLosSuministros = suministrosRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Guardar suministros
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = detallesVolquetaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.maquinaria = maquinariaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.empresas = empresasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proveedores = proveedoresRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proyectos = proyectosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error cargando datos:", error);
        document.getElementById('loadingMessage').textContent = "Error al cargar datos. Revisa la consola (F12).";
    } finally {
        if (document.getElementById('loaderContainer')) { document.getElementById('loaderContainer').style.display = 'none'; }
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

// ===== INICIO DE FUNCIÓN MODIFICADA (Llama a nuevas funciones) =====
function actualizarTodaLaUI() {
    poblarFiltroDeMes();
    poblarFiltrosReportes();
    const consumosFiltrados = obtenerConsumosFiltrados();
    // Filtramos también los suministros con las mismas fechas/proyecto si aplica
    const suministrosFiltrados = obtenerSuministrosFiltrados(); 
    
    // Cálculos de Consumos
    calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
    calcularYMostrarTotalesPorProveedor(consumosFiltrados);
    calcularYMostrarTotalesPorProyecto(consumosFiltrados);
    calcularYMostrarTotalesPorChofer(consumosFiltrados);
    calcularYMostrarTotales(consumosFiltrados); // Por Placa

    // Cálculos de Suministros (Nuevas llamadas)
    calcularYMostrarSuministrosPorVolqueta(suministrosFiltrados);
    calcularYMostrarSuministrosPorMaquinaria(suministrosFiltrados);

    poblarSelectores();
    mostrarListasAdmin();
    
    // Mostrar Historiales (Llamada a nueva función)
    mostrarHistorialAgrupado(consumosFiltrados);
    mostrarHistorialSuministros(suministrosFiltrados); 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function poblarSelectores() { /* ... (sin cambios) ... */ }
function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarSuministro(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN NUEVA (Filtra Suministros) =====
function obtenerSuministrosFiltrados() {
    // Reutiliza los mismos filtros de fecha y proyecto que los consumos
    const obtenerValorFiltro = (syncId) => document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`).value;
    const mes = obtenerValorFiltro('filtroMes');
    const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
    const fechaFin = obtenerValorFiltro('filtroFechaFin');
    const proyecto = obtenerValorFiltro('filtroProyecto'); // Podríamos filtrar suministros por proyecto también

    let suministrosFiltrados = todosLosSuministros;

    if (fechaInicio && fechaFin) {
        if (fechaFin < fechaInicio) { return []; } // Evitar error si ya se notificó
        suministrosFiltrados = suministrosFiltrados.filter(s => s.fecha >= fechaInicio && s.fecha <= fechaFin);
    } else if (fechaInicio) {
        suministrosFiltrados = suministrosFiltrados.filter(s => s.fecha === fechaInicio);
    } else if (mes !== 'todos') {
        suministrosFiltrados = suministrosFiltrados.filter(s => s.fecha.startsWith(mes));
    }
    
    if (proyecto !== 'todos') {
        suministrosFiltrados = suministrosFiltrados.filter(s => s.proyecto === proyecto);
    }

    // Podríamos añadir filtros específicos para volqueta suministrante o maquinaria receptora si fuera necesario

    return suministrosFiltrados;
}
// ===== FIN DE FUNCIÓN NUEVA =====

function mostrarListasAdmin() { /* ... (sin cambios) ... */ }
async function modificarItemAdmin(item, tipo) { /* ... (sin cambios) ... */ }
function cargarDatosParaModificar(id) { /* ... (sin cambios) ... */ }
function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIONES NUEVAS (Cálculos para Suministros) =====
function calcularYMostrarSuministrosPorVolqueta(suministros) {
    const resumenBody = document.getElementById('resumenSuministroVolquetaBody');
    const resumenFooter = document.getElementById('resumenSuministroVolquetaFooter');
    resumenBody.innerHTML = ''; resumenFooter.innerHTML = '';
    const totales = {};
    suministros.forEach(s => {
        const clave = s.volquetaSuministrante;
        if (!clave) return;
        if (!totales[clave]) totales[clave] = { totalGalones: 0 };
        totales[clave].totalGalones += parseFloat(s.galonesSuministrados) || 0;
    });
    if (Object.keys(totales).length === 0) { resumenBody.innerHTML = `<tr><td colspan="2" class="empty-state">No hay datos.</td></tr>`; return; }
    const clavesOrdenadas = Object.keys(totales).sort();
    let htmlBody = '', granTotalGalones = 0;
    clavesOrdenadas.forEach(clave => {
        const total = totales[clave];
        htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td></tr>`;
        granTotalGalones += total.totalGalones;
    });
    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td></tr>`;
}

function calcularYMostrarSuministrosPorMaquinaria(suministros) {
    const resumenBody = document.getElementById('resumenSuministroMaquinariaBody');
    const resumenFooter = document.getElementById('resumenSuministroMaquinariaFooter');
    resumenBody.innerHTML = ''; resumenFooter.innerHTML = '';
    const totales = {};
    suministros.forEach(s => {
        const clave = s.maquinariaReceptora;
        if (!clave) return;
        if (!totales[clave]) totales[clave] = { totalGalones: 0 };
        totales[clave].totalGalones += parseFloat(s.galonesSuministrados) || 0;
    });
    if (Object.keys(totales).length === 0) { resumenBody.innerHTML = `<tr><td colspan="2" class="empty-state">No hay datos.</td></tr>`; return; }
    const clavesOrdenadas = Object.keys(totales).sort();
    let htmlBody = '', granTotalGalones = 0;
    clavesOrdenadas.forEach(clave => {
        const total = totales[clave];
        htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td></tr>`;
        granTotalGalones += total.totalGalones;
    });
    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td></tr>`;
}
// ===== FIN DE FUNCIONES NUEVAS =====

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

// ===== INICIO DE FUNCIÓN NUEVA (Muestra Historial de Suministros) =====
function mostrarHistorialSuministros(suministros) {
    const historialBody = document.getElementById('historialSuministrosBody'); 
    const historialFooter = document.getElementById('historialSuministrosFooter');
    historialBody.innerHTML = ''; historialFooter.innerHTML = '';

    // Ajustar colspan para el estado vacío (6 columnas ahora)
    if (suministros.length === 0) { 
        historialBody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron suministros.</p></td></tr>`; 
        return; 
    }
    
    let totalGalonesSuministrados = 0;
    // Ordenar suministros por fecha descendente
    suministros.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)); 
    
    suministros.forEach(suministro => {
        totalGalonesSuministrados += parseFloat(suministro.galonesSuministrados) || 0;
        
        const filaDato = document.createElement('tr');
        // Aquí no añadimos botones de editar/borrar por ahora, se puede hacer después si es necesario
        filaDato.innerHTML = `
            <td>${suministro.fecha}</td>
            <td>${suministro.volquetaSuministrante}</td>
            <td>${suministro.maquinariaReceptora}</td>
            <td>${(parseFloat(suministro.galonesSuministrados) || 0).toFixed(2)}</td>
            <td>${suministro.proyecto || ''}</td>
            <td>${suministro.descripcion || ''}</td>`;
        historialBody.appendChild(filaDato);
    });
    
    // Ajustar colspan para el footer (ahora son 6 columnas)
    historialFooter.innerHTML = `<tr><td colspan="3" style="text-align: right;"><strong>TOTAL GALONES SUMINISTRADOS:</strong></td><td><strong>${totalGalonesSuministrados.toFixed(2)}</strong></td><td colspan="2"></td></tr>`;
}
// ===== FIN DE FUNCIÓN NUEVA =====

function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios, ya tiene los eventos de suministro) ... */ }
function iniciarAplicacion() { /* ... (sin cambios) ... */ }

document.getElementById('login-form').addEventListener('submit', handleLogin);
btnLogout.addEventListener('click', handleLogout);