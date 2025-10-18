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
const btnCerrarModal = modal.querySelector('.close-button');
function abrirModal() { 
    document.getElementById('seccionSuministro').style.display = 'none';
    document.getElementById('suministroForm').style.display = 'none';
    document.getElementById('preguntaSuministroBotones').style.display = 'block';
    document.getElementById('formularioContainer').style.display = 'block'; 
    document.getElementById('suministrosGuardadosLista').innerHTML = ''; 
    modal.style.display = 'block'; 
}
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); cargarDatosIniciales(); } 
function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("main-tab-link");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    const tabElement = document.getElementById(tabName); // <- Guardar referencia
    if (tabElement) { // <- Verificar si existe
       tabElement.style.display = "block"; 
    } else {
        console.error("No se encontró el contenido de la pestaña:", tabName);
    }
    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) { buttonToActivate.className += " active"; }
}

async function cargarDatosIniciales() {
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
        
        const [
            consumosRes, suministrosRes, choferesRes, placasRes, detallesVolquetaRes, maquinariaRes, 
            empresasRes, proveedoresRes, proyectosRes
        ] = await Promise.all(collectionsToLoad);
        
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        todosLosSuministros = suministrosRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = detallesVolquetaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.maquinaria = maquinariaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
        listasAdmin.empresas = empresasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proveedores = proveedoresRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proyectos = proyectosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error crítico cargando datos iniciales:", error);
        if (loadingMessageElement) loadingMessageElement.textContent = "Error al cargar datos. Revisa la consola (F12) e intenta recargar.";
        // No llamamos a actualizarTodaLaUI si hay un error crítico
    } finally {
        const loaderContainer = document.getElementById('loaderContainer');
        if (loaderContainer) loaderContainer.style.display = 'none'; 
    }
}

function actualizarTodaLaUI() {
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
    } catch (error) {
        console.error("Error actualizando la UI:", error);
        mostrarNotificacion("Ocurrió un error al actualizar la interfaz.", "error");
    }
}

// ===== INICIO DE FUNCIÓN CORREGIDA =====
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
        // CORRECCIÓN: Verificar si listasAdmin[tipo] existe antes de usarlo
        if (!select || !listasAdmin[tipo]) { 
            // console.warn(`Selector o lista no encontrada para tipo: ${tipo}`); // Opcional: para depuración
            continue; 
        }
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulosConsumo[tipo] || '--- Seleccione ---'}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }

    const selectMaquinaria = document.getElementById('selectMaquinaria');
    const selectSuministroProyecto = document.getElementById('selectSuministroProyecto');
    
    // CORRECCIÓN: Verificar si listasAdmin.maquinaria existe
    if (selectMaquinaria && listasAdmin.maquinaria) {
        const valorMaquinaria = selectMaquinaria.value;
        selectMaquinaria.innerHTML = `<option value="">--- Maquinaria ---</option>`;
        listasAdmin.maquinaria.forEach(item => { selectMaquinaria.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        selectMaquinaria.value = valorMaquinaria;
    }
    // CORRECCIÓN: Verificar si listasAdmin.proyectos existe
    if (selectSuministroProyecto && listasAdmin.proyectos) {
         const valorProyecto = selectSuministroProyecto.value;
        selectSuministroProyecto.innerHTML = `<option value="">--- Proyecto (Opcional) ---</option>`;
        listasAdmin.proyectos.forEach(item => { selectSuministroProyecto.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        selectSuministroProyecto.value = valorProyecto;
    }
}
// ===== FIN DE FUNCIÓN CORREGIDA =====

function reiniciarFormulario() { /* ... (sin cambios) ... */ }
async function guardarOActualizar(e) { /* ... (sin cambios) ... */ }
async function guardarSuministro(e) { /* ... (sin cambios) ... */ }
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios) ... */ }
function manejarAccionesHistorial(e) { /* ... (sin cambios) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios) ... */ }
function obtenerSuministrosFiltrados() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN CORREGIDA =====
function mostrarListasAdmin() {
    const contenedores = { 
        choferes: 'listaChoferes', placas: 'listaPlacas', detallesVolqueta: 'listaDetallesVolqueta', 
        maquinaria: 'listaMaquinaria', empresas: 'listaEmpresas', proveedores: 'listaProveedores', 
        proyectos: 'listaProyectos' 
    };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        // CORRECCIÓN: Verificar si listasAdmin[tipo] existe
        if (!ul || !listasAdmin[tipo]) {
            // console.warn(`Contenedor UL o lista no encontrada para tipo: ${tipo}`); // Opcional: para depuración
            if(ul) ul.innerHTML = `<li class="empty-state">Error al cargar.</li>`; // Informar al usuario
            continue; 
        }
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) { ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; continue; }
        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));
        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nombre}</span><div><button class="btn-accion btn-modificar button-warning" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button><button class="btn-accion btn-borrar" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button></div>`;
            li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
            li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}
// ===== FIN DE FUNCIÓN CORREGIDA =====

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

// ===== INICIO DE FUNCIÓN CORREGIDA =====
function asignarEventosApp() {
    // Asegurarse que los elementos existen antes de añadir listeners
    const elBtnAbrirModal = document.getElementById('btnAbrirModal');
    if (elBtnAbrirModal) elBtnAbrirModal.addEventListener('click', abrirModal);
    
    const elBtnCerrarModal = modal ? modal.querySelector('.close-button') : null;
    if (elBtnCerrarModal) elBtnCerrarModal.addEventListener('click', cerrarModal);
    
    const elBtnTabRegistrar = document.getElementById('btnTabRegistrar');
    if (elBtnTabRegistrar) elBtnTabRegistrar.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    
    const elBtnTabReportes = document.getElementById('btnTabReportes');
    if (elBtnTabReportes) elBtnTabReportes.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    
    const elBtnTabHistorial = document.getElementById('btnTabHistorial');
    if (elBtnTabHistorial) elBtnTabHistorial.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    
    const elBtnTabAdmin = document.getElementById('btnTabAdmin');
    if (elBtnTabAdmin) elBtnTabAdmin.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    const elConsumoForm = document.getElementById('consumoForm');
    if (elConsumoForm) elConsumoForm.addEventListener('submit', guardarOActualizar);

    // Eventos Suministro
    const elBtnSiSuministro = document.getElementById('btnSiSuministro');
    if (elBtnSiSuministro) elBtnSiSuministro.addEventListener('click', () => {
        document.getElementById('preguntaSuministroBotones').style.display = 'none';
        document.getElementById('suministroForm').style.display = 'flex'; 
        poblarSelectores(); 
        document.getElementById('selectMaquinaria').focus();
    });
    
    const elBtnNoSuministro = document.getElementById('btnNoSuministro');
    if (elBtnNoSuministro) elBtnNoSuministro.addEventListener('click', cerrarModal);
    
    const elSuministroForm = document.getElementById('suministroForm');
    if (elSuministroForm) elSuministroForm.addEventListener('submit', guardarSuministro);

    const elBtnFinalizarSuministro = document.getElementById('btnFinalizarSuministro');
    if (elBtnFinalizarSuministro) elBtnFinalizarSuministro.addEventListener('click', cerrarModal);

    // Eventos Impresión y Filtros
    document.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', (e) => { /* ... (sin cambios) ... */ }));
    window.onafterprint = () => { /* ... (sin cambios) ... */ };
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => { /* ... (sin cambios) ... */ }));
    
    const elHistorialBody = document.getElementById('historialBody');
    if (elHistorialBody) elHistorialBody.addEventListener('click', manejarAccionesHistorial);

    // Eventos Forms Admin
    const elFormAdminChofer = document.getElementById('formAdminChofer');
    if (elFormAdminChofer) elFormAdminChofer.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    
    const elFormAdminPlaca = document.getElementById('formAdminPlaca');
    if (elFormAdminPlaca) elFormAdminPlaca.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    
    const elFormAdminDetalles = document.getElementById('formAdminDetallesVolqueta');
    if (elFormAdminDetalles) elFormAdminDetalles.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); });
    
    const elFormAdminMaquinaria = document.getElementById('formAdminMaquinaria');
    if (elFormAdminMaquinaria) elFormAdminMaquinaria.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('maquinaria', document.getElementById('nuevaMaquinaria')); });
    
    const elFormAdminEmpresa = document.getElementById('formAdminEmpresa');
    if (elFormAdminEmpresa) elFormAdminEmpresa.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    
    const elFormAdminProveedor = document.getElementById('formAdminProveedor');
    if (elFormAdminProveedor) elFormAdminProveedor.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    
    const elFormAdminProyecto = document.getElementById('formAdminProyecto');
    if (elFormAdminProyecto) elFormAdminProyecto.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => {
        boton.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) { panel.style.maxHeight = null; } else { panel.style.maxHeight = panel.scrollHeight + "px"; } 
        });
    });
    asignarSincronizacionDeFiltros();
}
// ===== FIN DE FUNCIÓN CORREGIDA =====

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);