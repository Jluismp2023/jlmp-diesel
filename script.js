import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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

let todosLosConsumos = [];
// Asegúrate que maquinaria esté en la lista
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

    if (!vistaLogin || !vistaApp) {
        console.error("CRITICAL ERROR! Cannot find 'vista-login' or 'vista-app'.");
        document.body.innerHTML = "<h1>Critical Error: UI elements missing. Please reload.</h1>";
        return;
    }

    onAuthStateChanged(auth, (user) => {
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

    const elLoginForm = document.getElementById('login-form');
    if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
function abrirModal() { if(modal) modal.style.display = 'block'; }
function cerrarModal() { if(modal) modal.style.display = 'none'; reiniciarFormulario(); }
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }

async function cargarDatosIniciales() {
    const loadingMessageElement = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    if (loaderContainer) loaderContainer.style.display = 'block';

    try {
        const [
            consumosRes, choferesRes, placasRes, detallesVolquetaRes, maquinariaRes, 
            empresasRes, proveedoresRes, proyectosRes
        ] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))), 
            getDocs(query(collection(db, "maquinaria"), orderBy("nombre"))), 
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        if(loadingMessageElement) loadingMessageElement.textContent = "Error al cargar datos. Revisa la consola (F12).";
    } finally {
        if (loaderContainer) { loaderContainer.style.display = 'none'; }
    }
}

function actualizarTodaLaUI() {
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();
        let consumosFiltrados = obtenerConsumosFiltrados();
        if (!Array.isArray(consumosFiltrados)) { consumosFiltrados = []; }
        
        calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
        calcularYMostrarTotalesPorProveedor(consumosFiltrados);
        calcularYMostrarTotalesPorProyecto(consumosFiltrados);
        calcularYMostrarTotalesPorChofer(consumosFiltrados);
        calcularYMostrarTotales(consumosFiltrados);
        poblarSelectores();
        mostrarListasAdmin();
        mostrarHistorialAgrupado(consumosFiltrados);
    } catch (error) {
        console.error("Error en actualizarTodaLaUI:", error);
        mostrarNotificacion("Error al actualizar la interfaz.", "error");
    }
}

function poblarSelectores() {
    const selectores = { 
        choferes: document.getElementById('selectChofer'), 
        placas: document.getElementById('selectVolqueta'), 
        detallesVolqueta: document.getElementById('selectDetallesVolqueta'), 
        empresas: document.getElementById('selectEmpresa'), 
        proveedores: document.getElementById('selectProveedor'), 
        proyectos: document.getElementById('selectProyecto') 
    };
    const titulos = { 
        choferes: '--- Chofer ---', placas: '--- Placa ---', detallesVolqueta: '--- Detalles Volqueta ---', 
        empresas: '--- Empresa ---', proveedores: '--- Proveedor ---', proyectos: '--- Proyecto ---' 
    };
    for (const tipo in selectores) {
        const select = selectores[tipo];
        if (!select || !listasAdmin[tipo] || !titulos[tipo]) { continue; } 
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}

function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function manejarAccionesHistorial(e) { 
    const target = e.target.closest('button'); 
    if (!target) return;
    const id = target.dataset.id; 
    if (!id) return; 
    if (target.classList.contains('btn-modificar')) cargarDatosParaModificar(id); 
    if (target.classList.contains('btn-borrar')) borrarConsumoHistorial(id);
    // Nueva acción para distribuir
    if (target.classList.contains('btn-distribuir')) abrirModalDistribucion(id); 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

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

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody'); 
    const historialFooter = document.getElementById('historialFooter');
    if (!historialBody || !historialFooter) { console.error("Elementos del historial no encontrados"); return; }
    historialBody.innerHTML = ''; 
    historialFooter.innerHTML = '';

    // Ajustar colspan para el estado vacío (ahora 15 columnas)
    if (!Array.isArray(consumos) || consumos.length === 0) { 
        historialBody.innerHTML = `<tr><td colspan="15" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`; 
        return; 
    }
    let totalGalones = 0, totalCosto = 0;
    const consumosOrdenados = [...consumos].sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumosOrdenados.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; 
        totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); 
        const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        
        const fechaInicioFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaInicio"]')?.value;
        const fechaFinFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaFin"]')?.value;

        if (mesAnio !== mesAnioActual && !(fechaInicioFiltro && fechaFinFiltro)) { 
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr'); 
            filaGrupo.className = 'fila-grupo'; 
            // Ajustar colspan
            filaGrupo.innerHTML = `<td colspan="15">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        // Añadir la nueva celda con el botón Distribuir
        filaDato.innerHTML = `
            <td class="no-print">
                <button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                <button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
            </td>
            <td class="no-print">
                 <button class="btn-accion btn-distribuir button-info" data-id="${consumo.id}" title="Distribuir Diésel"><i class="fa-solid fa-share-from-square" style="margin: 0;"></i></button>
            </td>
            <td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.numeroFactura || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td><td>${consumo.kilometraje || ''}</td>
            <td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    // Ajustar colspan del footer
    historialFooter.innerHTML = `<tr><td class="no-print" colspan="2"></td><td colspan="8" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

// ===== INICIO DE FUNCIÓN NUEVA (Placeholder) =====
function abrirModalDistribucion(consumoId) {
    console.log("Abrir modal distribución para el consumo ID:", consumoId);
    // Aquí irá la lógica para abrir el nuevo modal y cargar datos
    mostrarNotificacion("Funcionalidad 'Distribuir' aún no implementada.", "info"); 
}
// ===== FIN DE FUNCIÓN NUEVA =====

function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios) ... */ }
function iniciarAplicacion() { /* ... (sin cambios) ... */ }