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
    console.log("Estado de autenticación cambiado. Usuario:", user ? user.email : 'Ninguno');
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        btnLogout.style.display = 'block';
        if (!appInicializada) {
            console.log("Usuario autenticado, iniciando aplicación...");
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        console.log("Usuario no autenticado, mostrando login.");
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        btnLogout.style.display = 'none';
        appInicializada = false;
    }
});

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null;
function abrirModal() { /* ... (sin cambios) ... */ }
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); }
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }

async function cargarDatosIniciales() {
    console.log("Iniciando carga de datos iniciales...");
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
        
        console.log("Datos cargados:", { 
            consumos: todosLosConsumos.length,
            suministros: todosLosSuministros.length,
            listasAdmin 
        });

        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error crítico cargando datos iniciales:", error); 
        if (loadingMessageElement) loadingMessageElement.textContent = "Error al cargar datos. Revisa la consola (F12) e intenta recargar.";
    } finally {
        const loaderContainer = document.getElementById('loaderContainer');
        if (loaderContainer) loaderContainer.style.display = 'none'; 
    }
}

// ===== INICIO DE FUNCIÓN MODIFICADA (Añadir logs y chequeos) =====
function actualizarTodaLaUI() {
    console.log("Actualizando toda la UI...");
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();

        const consumosFiltrados = obtenerConsumosFiltrados();
        // --- NUEVO LOG Y CHEQUEO ---
        console.log("Valor de consumosFiltrados antes de mostrar historial:", consumosFiltrados); 
        if (consumosFiltrados === undefined) {
             console.error("¡ALERTA! obtenerConsumosFiltrados devolvió undefined!"); 
             // Forzamos un array vacío para evitar el error fatal, aunque indica un problema
             consumosFiltrados = []; 
        }
        // --- FIN NUEVO LOG Y CHEQUEO ---

        const suministrosFiltrados = obtenerSuministrosFiltrados();
        // --- NUEVO LOG Y CHEQUEO ---
        console.log("Valor de suministrosFiltrados antes de mostrar historial:", suministrosFiltrados); 
        if (suministrosFiltrados === undefined) {
             console.error("¡ALERTA! obtenerSuministrosFiltrados devolvió undefined!");
             suministrosFiltrados = [];
        }
        // --- FIN NUEVO LOG Y CHEQUEO ---
        
        calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
        calcularYMostrarTotalesPorProveedor(consumosFiltrados);
        calcularYMostrarTotalesPorProyecto(consumosFiltrados);
        calcularYMostrarTotalesPorChofer(consumosFiltrados);
        calcularYMostrarTotales(consumosFiltrados); 

        calcularYMostrarSuministrosPorVolqueta(suministrosFiltrados);
        calcularYMostrarSuministrosPorMaquinaria(suministrosFiltrados);

        poblarSelectores();
        mostrarListasAdmin();
        
        mostrarHistorialAgrupado(consumosFiltrados); // El error ocurría aquí
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

function mostrarHistorialAgrupado(consumos) { 
    console.log(`Intentando mostrar historial agrupado con ${consumos ? consumos.length : 'undefined'} registros.`); 
    const historialBody = document.getElementById('historialBody');
    const historialFooter = document.getElementById('historialFooter');
    if (!historialBody || !historialFooter) { console.error("Elementos del historial (body o footer) no encontrados."); return; }
    historialBody.innerHTML = ''; 
    historialFooter.innerHTML = '';
    
    // CORRECCIÓN: Usar !Array.isArray(consumos) para una verificación más robusta
    if (!Array.isArray(consumos) || consumos.length === 0) { 
        console.warn("mostrarHistorialAgrupado recibió datos inválidos o vacíos:", consumos); // Diagnóstico
        historialBody.innerHTML = `<tr><td colspan="14" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`; 
        return; 
    }
    // ... resto de la función ...
     let totalGalones = 0, totalCosto = 0;
    consumos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumos.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
        if (mesAnio !== mesAnioActual && !(obtenerConsumosFiltrados.fechaInicio && obtenerConsumosFiltrados.fechaFin)) {
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr'); filaGrupo.className = 'fila-grupo'; 
            filaGrupo.innerHTML = `<td colspan="14">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        filaDato.innerHTML = `<td class="no-print"><button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button><button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button></td>
            <td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.numeroFactura || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td><td>${consumo.kilometraje || ''}</td>
            <td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    historialFooter.innerHTML = `<tr><td class="no-print"></td><td colspan="9" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
}
function mostrarHistorialSuministros(suministros) { 
    console.log(`Intentando mostrar historial de suministros con ${suministros ? suministros.length : 'undefined'} registros.`); 
    const historialBody = document.getElementById('historialSuministrosBody'); 
    const historialFooter = document.getElementById('historialSuministrosFooter');
    if (!historialBody || !historialFooter) { console.error("Elementos del historial de suministros (body o footer) no encontrados."); return; }
    historialBody.innerHTML = ''; 
    historialFooter.innerHTML = '';

    // CORRECCIÓN: Usar !Array.isArray(suministros)
    if (!Array.isArray(suministros) || suministros.length === 0) { 
        console.warn("mostrarHistorialSuministros recibió datos inválidos o vacíos:", suministros); // Diagnóstico
        historialBody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron suministros.</p></td></tr>`; 
        return; 
    }
    // ... resto de la función ...
    let totalGalonesSuministrados = 0;
    suministros.sort((a,b) => new Date(b.fecha) - new Date(a.fecha)); 
    suministros.forEach(suministro => {
        totalGalonesSuministrados += parseFloat(suministro.galonesSuministrados) || 0;
        const filaDato = document.createElement('tr');
        filaDato.innerHTML = `
            <td>${suministro.fecha}</td>
            <td>${suministro.volquetaSuministrante}</td>
            <td>${suministro.maquinariaReceptora}</td>
            <td>${(parseFloat(suministro.galonesSuministrados) || 0).toFixed(2)}</td>
            <td>${suministro.proyecto || ''}</td>
            <td>${suministro.descripcion || ''}</td>`;
        historialBody.appendChild(filaDato);
    });
    historialFooter.innerHTML = `<tr><td colspan="3" style="text-align: right;"><strong>TOTAL GALONES SUMINISTRADOS:</strong></td><td><strong>${totalGalonesSuministrados.toFixed(2)}</strong></td><td colspan="2"></td></tr>`;
}
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios) ... */ }
function iniciarAplicacion() { /* ... (sin cambios) ... */ }

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);

console.log("Script cargado y eventos iniciales asignados.");