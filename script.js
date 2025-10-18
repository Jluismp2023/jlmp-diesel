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
// ===== INICIO DE LÍNEA MODIFICADA =====
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
// ===== FIN DE LÍNEA MODIFICADA =====
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

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function cargarDatosIniciales() {
    const loadingMessageElement = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    if (loaderContainer) loaderContainer.style.display = 'block';

    try {
        const [
            consumosRes, choferesRes, placasRes, detallesVolquetaRes, maquinariaRes, // Añadir maquinariaRes
            empresasRes, proveedoresRes, proyectosRes
        ] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))), 
            getDocs(query(collection(db, "maquinaria"), orderBy("nombre"))), // Cargar nueva colección
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = detallesVolquetaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.maquinaria = maquinariaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Guardar maquinaria
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
// ===== FIN DE FUNCIÓN MODIFICADA =====

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

// ===== INICIO DE FUNCIÓN MODIFICADA =====
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
        // Asegurarse que la lista existe en listasAdmin
        if (!select || !listasAdmin[tipo] || !titulos[tipo]) { continue; } 
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function agregarItemAdmin(tipo, inputElement) {
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "maquinaria", "empresas", "proveedores", "proyectos"]; // Añadir maquinaria
    if (!coleccionesPermitidas.includes(tipo)) { console.error("Tipo inválido:", tipo); mostrarNotificacion("Error interno.", "error"); return; }
    if (!inputElement) { console.error("Input no encontrado."); return; }
    const valor = (tipo === 'placas') ? inputElement.value.trim().toUpperCase() : inputElement.value.trim();
    if (valor && listasAdmin[tipo]) { 
        const listaNombres = listasAdmin[tipo].map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(valor.toUpperCase())) { mostrarNotificacion(`"${valor}" ya existe.`, "error"); return; }
        try { await addDoc(collection(db, tipo), { nombre: valor }); mostrarNotificacion(`Elemento agregado.`, "exito"); inputElement.value = ''; await cargarDatosIniciales(); } 
        catch (error) { console.error("Error agregando:", error); mostrarNotificacion("No se pudo agregar.", "error"); }
    } else if (!listasAdmin[tipo]) { console.error(`Lista para "${tipo}" no existe.`); }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function mostrarListasAdmin() {
    const contenedores = { 
        choferes: 'listaChoferes', placas: 'listaPlacas', detallesVolqueta: 'listaDetallesVolqueta', 
        maquinaria: 'listaMaquinaria', // Nuevo contenedor
        empresas: 'listaEmpresas', proveedores: 'listaProveedores', proyectos: 'listaProyectos' 
    };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul || !listasAdmin[tipo]) { if(ul) ul.innerHTML = `<li class="empty-state">Error al cargar.</li>`; continue; }
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) { ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; continue; }
        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));
        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nombre}</span><div><button class="btn-accion btn-modificar button-warning" data-id="${item.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button><button class="btn-accion btn-borrar" data-id="${item.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button></div>`;
             li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
             li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function modificarItemAdmin(item, tipo) { 
    const valorActual = item.nombre; const nuevoValor = prompt(`Modificar "${valorActual}":`, valorActual); 
    if (!nuevoValor || nuevoValor.trim() === '' || nuevoValor.trim() === valorActual) return; 
    const valorFormateado = (tipo === 'placas') ? nuevoValor.trim().toUpperCase() : nuevoValor.trim(); 
    const propiedad = { 
        placas: 'volqueta', choferes: 'chofer', empresas: 'empresa', proveedores: 'proveedor', 
        proyectos: 'proyecto', detallesVolqueta: 'detallesVolqueta', maquinaria: null // Maquinaria no afecta registros de consumo
    }[tipo]; 
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "maquinaria", "empresas", "proveedores", "proyectos"]; // Añadir maquinaria
     if (!coleccionesPermitidas.includes(tipo)) { console.error("Tipo inválido:", tipo); mostrarNotificacion("Error interno.", "error"); return; }
    
    // Si la propiedad es null (como en maquinaria), solo actualiza el item en su colección
    if (propiedad === null) {
         if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"?`)) { 
            try { await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); await cargarDatosIniciales(); mostrarNotificacion("Elemento actualizado.", "exito"); } 
            catch(e) { console.error("Error modificando:", e); mostrarNotificacion("Error al modificar.", "error"); }
         } return; 
    }
    // Si la propiedad no está definida para el tipo (error interno)
    if (!propiedad) { console.error("Propiedad no encontrada para tipo:", tipo); mostrarNotificacion("Error interno.", "error"); return; }

    // Actualización masiva
    if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"? Esto actualizará TODOS los registros asociados.`)) { 
        try { 
            await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); 
            const q = query(collection(db, "consumos"), where(propiedad, "==", valorActual));
            const snapshot = await getDocs(q);
            const updates = snapshot.docs.map(docSnapshot => updateDoc(docSnapshot.ref, { [propiedad]: valorFormateado }));
            await Promise.all(updates); await cargarDatosIniciales(); mostrarNotificacion("Actualización masiva completada.", "exito"); 
        } catch(e) { console.error("Error en mod. masiva:", e); mostrarNotificacion("Error al actualizar masivamente.", "error"); } 
    } 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


function cargarDatosParaModificar(id) { /* ... (sin cambios) ... */ }
function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... (sin cambios) ... */ }
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function borrarItemAdmin(item, tipo) { 
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "maquinaria", "empresas", "proveedores", "proyectos"]; // Añadir maquinaria
    if (!coleccionesPermitidas.includes(tipo)) { console.error("Tipo inválido:", tipo); mostrarNotificacion("Error interno.", "error"); return; }
    if (!item || !item.id || !item.nombre) { console.error("Item inválido:", item); mostrarNotificacion("Error al identificar elemento.", "error"); return; }
    if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) { 
        try { await deleteDoc(doc(db, tipo, item.id)); mostrarNotificacion("Elemento borrado.", "exito"); await cargarDatosIniciales(); } 
        catch(e) { console.error("Error borrando:", e); mostrarNotificacion("No se pudo borrar.", "error"); } 
    } 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

async function borrarConsumoHistorial(id) { /* ... (sin cambios) ... */ }
function poblarFiltroDeMes() { /* ... (sin cambios) ... */ }
function poblarFiltrosReportes() { /* ... (sin cambios) ... */ }
function mostrarHistorialAgrupado(consumos) { /* ... (sin cambios) ... */ }
function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function asignarEventosApp() {
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    const btnReg = document.getElementById('btnTabRegistrar'); if(btnReg) btnReg.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    const btnRep = document.getElementById('btnTabReportes'); if(btnRep) btnRep.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    const btnHist = document.getElementById('btnTabHistorial'); if(btnHist) btnHist.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    const btnAdm = document.getElementById('btnTabAdmin'); if(btnAdm) btnAdm.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    const consumoForm = document.getElementById('consumoForm'); if(consumoForm) consumoForm.addEventListener('submit', guardarOActualizar);
    document.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', (e) => { /* ... */ }));
    window.onafterprint = () => { /* ... */ };
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => { /* ... */ }));
    const histBody = document.getElementById('historialBody'); if(histBody) histBody.addEventListener('click', manejarAccionesHistorial);
    // Forms Admin
    const formChofer = document.getElementById('formAdminChofer'); if(formChofer) formChofer.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    const formPlaca = document.getElementById('formAdminPlaca'); if(formPlaca) formPlaca.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    const formDetalles = document.getElementById('formAdminDetallesVolqueta'); if(formDetalles) formDetalles.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); }); 
    const formMaquinaria = document.getElementById('formAdminMaquinaria'); if(formMaquinaria) formMaquinaria.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('maquinaria', document.getElementById('nuevaMaquinaria')); }); // <-- NUEVO EVENTO
    const formEmpresa = document.getElementById('formAdminEmpresa'); if(formEmpresa) formEmpresa.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    const formProveedor = document.getElementById('formAdminProveedor'); if(formProveedor) formProveedor.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    const formProyecto = document.getElementById('formAdminProyecto'); if(formProyecto) formProyecto.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => { boton.addEventListener('click', function() { /* ... */ }); });
    asignarSincronizacionDeFiltros();
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}