import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ... (firebaseConfig, app, db, auth, variables globales, event listener DOMContentLoaded - sin cambios) ...
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let vistaLogin, vistaApp, btnLogout, modal, btnAbrirModal, btnCerrarModal;
let modalDistribucion, btnCerrarModalDistribucion, btnFinalizarDistribucion;
let todosLosConsumos = [];
let listasAdmin = { /* ... */ };
let appInicializada = false;
let tabActivaParaImprimir = null;
document.addEventListener('DOMContentLoaded', () => { /* ... */ });

function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) { /* ... (sin cambios) ... */ }
function abrirModal() { /* ... (sin cambios) ... */ }
function cerrarModal() { /* ... (sin cambios) ... */ }
function abrirModalDistribucion(consumoId) { /* ... (sin cambios) ... */ }
function cerrarModalDistribucion() { /* ... (sin cambios) ... */ }
function actualizarInfoDistribucionModal(consumo) { /* ... (sin cambios) ... */ }
function openMainTab(evt, tabName) { /* ... (sin cambios) ... */ }
async function cargarDatosIniciales() { /* ... (sin cambios) ... */ }
function actualizarTodaLaUI() { /* ... (sin cambios) ... */ }
function poblarSelectores() { /* ... (sin cambios) ... */ }
function poblarSelectoresDistribucion() { /* ... (sin cambios) ... */ }
function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarDistribucion(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA (Logs detallados internos) =====
function mostrarListasAdmin() {
    console.log("-> Iniciando mostrarListasAdmin..."); // Log al inicio
    const contenedores = {
        choferes: 'listaChoferes', placas: 'listaPlacas', detallesVolqueta: 'listaDetallesVolqueta',
        maquinaria: 'listaMaquinaria', empresas: 'listaEmpresas', proveedores: 'listaProveedores',
        proyectos: 'listaProyectos'
    };
    let count = 0; // Contador para ver si entra al bucle
    for (const tipo in contenedores) {
        count++;
        console.log(` -> Procesando tipo: ${tipo}`); // Log por cada tipo
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul || !listasAdmin[tipo]) {
             console.warn(`  -> Contenedor UL o lista no encontrada para ${tipo}. Saltando.`);
             if(ul) ul.innerHTML = `<li class="empty-state">Error al cargar.</li>`;
             continue;
        }
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) {
            ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`;
            console.log(`  -> No hay elementos para ${tipo}.`); // Log lista vacía
            continue;
        }
        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));
        console.log(`  -> Mostrando ${listaOrdenada.length} elementos para ${tipo}.`); // Log número de elementos
        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nombre}</span><div><button class="btn-accion btn-modificar button-warning" data-id="${item.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button><button class="btn-accion btn-borrar" data-id="${item.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button></div>`;
             li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
             li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
     console.log(`-> mostrarListasAdmin procesó ${count} tipos.`); // Log final
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


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

// ===== INICIO DE FUNCIÓN MODIFICADA (Logs detallados internos) =====
function mostrarHistorialAgrupado(consumos) {
    console.log(`-> Iniciando mostrarHistorialAgrupado con ${consumos ? consumos.length : 'undefined'} registros.`); // Log al inicio
    const historialBody = document.getElementById('historialBody');
    const historialFooter = document.getElementById('historialFooter');
    if (!historialBody || !historialFooter) { console.error(" -> Elementos del historial (body o footer) no encontrados. Abortando."); return; }
    historialBody.innerHTML = '';
    historialFooter.innerHTML = '';

    if (!Array.isArray(consumos) || consumos.length === 0) {
        console.log(" -> No hay consumos para mostrar o no es un array."); // Log
        historialBody.innerHTML = `<tr><td colspan="15" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`;
        return;
    }
    let totalGalones = 0, totalCosto = 0;
    const consumosOrdenados = [...consumos].sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    console.log(` -> Procesando ${consumosOrdenados.length} consumos ordenados.`); // Log
    consumosOrdenados.forEach((consumo, index) => {
        // console.log(`  --> Procesando registro ${index + 1}:`, consumo); // Log muy detallado (opcional)
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
            filaGrupo.innerHTML = `<td colspan="15">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        filaDato.innerHTML = `<td class="no-print"><button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button><button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button></td>
            <td class="no-print"><button class="btn-accion btn-distribuir button-info" data-id="${consumo.id}" title="Distribuir Diésel"><i class="fa-solid fa-share-from-square" style="margin: 0;"></i></button></td>
            <td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.numeroFactura || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td><td>${consumo.kilometraje || ''}</td>
            <td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    historialFooter.innerHTML = `<tr><td class="no-print" colspan="2"></td><td colspan="8" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
    console.log("-> mostrarHistorialAgrupado completado."); // Log final
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }
function asignarEventosApp() { /* ... (sin cambios) ... */ }
function iniciarAplicacion() { /* ... (sin cambios) ... */ }

// ... (Eventos iniciales login/logout al final - sin cambios) ...