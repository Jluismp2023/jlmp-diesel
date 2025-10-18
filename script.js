import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"; // Añadir 'where' y 'arrayUnion'
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

// Declarar variables globales aquí
let vistaLogin, vistaApp, btnLogout, modal, btnAbrirModal, btnCerrarModal;
let modalDistribucion, btnCerrarModalDistribucion, btnFinalizarDistribucion;
let todosLosConsumos = [];
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;

// Esperar a que el DOM esté completamente cargado antes de asignar elementos y listeners
document.addEventListener('DOMContentLoaded', () => {
    // Asignar elementos principales del DOM
    vistaLogin = document.getElementById('vista-login');
    vistaApp = document.getElementById('vista-app');
    btnLogout = document.getElementById('btn-logout');
    modal = document.getElementById('modalRegistro');
    btnAbrirModal = document.getElementById('btnAbrirModal');
    btnCerrarModal = modal ? modal.querySelector('.close-button') : null;
    modalDistribucion = document.getElementById('modalDistribucion');
    btnCerrarModalDistribucion = document.getElementById('cerrarModalDistribucion');
    btnFinalizarDistribucion = document.getElementById('btnFinalizarDistribucion');

    // Verificar si los elementos críticos existen
    if (!vistaLogin || !vistaApp) {
        console.error("¡ERROR CRÍTICO! 'vista-login' o 'vista-app' no encontrados después de cargar DOM.");
        document.body.innerHTML = "<h1>Error crítico: Elementos principales de la interfaz no encontrados. Recargue la página.</h1>";
        return; // Detener si falta algo esencial
    }

    // Configurar listener de autenticación
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

    // Asignar eventos iniciales que dependen de elementos fuera de onAuthStateChanged
    const elLoginForm = document.getElementById('login-form');
    if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);
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

// --- Funciones de Modales ---
function abrirModal() { if(modal) modal.style.display = 'block'; }
function cerrarModal() { if(modal) modal.style.display = 'none'; reiniciarFormulario(); }
function abrirModalDistribucion(consumoId) {
    if (!modalDistribucion) { console.error("Modal de distribución no encontrado."); return; }
    const consumoOriginal = todosLosConsumos.find(c => c.id === consumoId);
    if (!consumoOriginal) { mostrarNotificacion("Registro original no encontrado.", "error"); return; }

    document.getElementById('distInfoFecha').textContent = consumoOriginal.fecha;
    document.getElementById('distInfoVolqueta').textContent = consumoOriginal.volqueta;
    document.getElementById('distInfoGalonesCargados').textContent = parseFloat(consumoOriginal.galones || 0).toFixed(2);
    document.getElementById('distribucionConsumoId').value = consumoId;

    poblarSelectoresDistribucion(); // Poblar selects del modal de distribución
    document.getElementById('distribucionForm').reset();
    document.getElementById('distribucionesAnterioresLista').innerHTML = '';
    actualizarInfoDistribucionModal(consumoOriginal);
    modalDistribucion.style.display = 'block';
}
function cerrarModalDistribucion() {
    if (modalDistribucion) { modalDistribucion.style.display = 'none'; }
    cargarDatosIniciales(); // Recargar datos para ver cambios en historial
}

// --- Funciones de Pestañas ---
function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    if (!tabcontent) return;
    for (i = 0; i < tabcontent.length; i++) { if(tabcontent[i]?.style) tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("main-tab-link");
    if(tablinks){
        for (i = 0; i < tablinks.length; i++) { if(tablinks[i]) tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    }
    const tabElement = document.getElementById(tabName);
    if (tabElement?.style) { tabElement.style.display = "block"; }
    else { console.error("No se encontró el contenido de la pestaña:", tabName); }
    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) { buttonToActivate.className += " active"; }
}

// --- Carga de Datos ---
async function cargarDatosIniciales() {
    const loadingMessageElement = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    if (loaderContainer) loaderContainer.style.display = 'block';

    try {
        const [ consumosRes, choferesRes, placasRes, detallesVolquetaRes, maquinariaRes, empresasRes, proveedoresRes, proyectosRes ] = await Promise.all([
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

// --- Actualización de UI ---
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
        calcularYMostrarTotales(consumosFiltrados); // Por Placa
        poblarSelectores(); // Pobla selectores del form principal
        mostrarListasAdmin();
        mostrarHistorialAgrupado(consumosFiltrados);
    } catch (error) {
        console.error("Error en actualizarTodaLaUI:", error);
        mostrarNotificacion("Error al actualizar la interfaz.", "error");
    }
}

// --- Poblar Selectores ---
function poblarSelectores() {
    const selectoresConsumo = { choferes: 'selectChofer', placas: 'selectVolqueta', detallesVolqueta: 'selectDetallesVolqueta', empresas: 'selectEmpresa', proveedores: 'selectProveedor', proyectos: 'selectProyecto' };
    const titulosConsumo = { choferes: '--- Chofer ---', placas: '--- Placa ---', detallesVolqueta: '--- Detalles Volqueta ---', empresas: '--- Empresa ---', proveedores: '--- Proveedor ---', proyectos: '--- Proyecto ---' };
    
    for (const tipo in selectoresConsumo) {
        const selectId = selectoresConsumo[tipo];
        const select = document.getElementById(selectId);
        if (!select || !listasAdmin[tipo] || !titulosConsumo[tipo]) { continue; }
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulosConsumo[tipo]}</option>`;
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}

function poblarSelectoresDistribucion() {
    const selectMaquinaria = document.getElementById('selectDistMaquinaria');
    const selectProyecto = document.getElementById('selectDistProyecto');
    if (selectMaquinaria && listasAdmin.maquinaria) {
        selectMaquinaria.innerHTML = `<option value="">--- Maquinaria ---</option>`;
        listasAdmin.maquinaria.forEach(item => { selectMaquinaria.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
    }
     if (selectProyecto && listasAdmin.proyectos) {
        selectProyecto.innerHTML = `<option value="">--- Proyecto (Opcional) ---</option>`;
        listasAdmin.proyectos.forEach(item => { selectProyecto.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
    }
}


// --- Resetear Formularios ---
function reiniciarFormulario() {
    const form = document.getElementById('consumoForm'); if(form) form.reset();
    const regId = document.getElementById('registroId'); if(regId) regId.value = '';
    const fechaInput = document.getElementById('fecha'); if(fechaInput) fechaInput.valueAsDate = new Date();
    const formTitle = document.getElementById('formularioTitulo'); if(formTitle) formTitle.textContent = 'Nuevo Registro';
    // Reiniciar también el form de distribución por si acaso
    const formDist = document.getElementById('distribucionForm'); if(formDist) formDist.reset();
    const distLista = document.getElementById('distribucionesAnterioresLista'); if(distLista) distLista.innerHTML = '';

    poblarSelectores(); // Poblar selectores del form principal
}

// --- Guardar Registros ---
async function guardarOActualizar(e) { /* ... (sin cambios desde la última versión correcta) ... */ }

async function guardarDistribucion(e) {
    e.preventDefault();
    const btnGuardarDist = document.getElementById('btnGuardarDistribucion');
    if (!btnGuardarDist) return;
    btnGuardarDist.disabled = true;
    btnGuardarDist.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const consumoId = document.getElementById('distribucionConsumoId').value;
    const consumoOriginal = todosLosConsumos.find(c => c.id === consumoId);

    if (!consumoOriginal) {
        mostrarNotificacion("Error: Registro original no encontrado.", "error");
         btnGuardarDist.disabled = false; btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
        return;
    }

    const galonesASuministrar = parseFloat(document.getElementById('distGalonesSuministrados').value);
    const distribucionesActuales = consumoOriginal.distribuciones || [];
    const galonesYaDistribuidos = distribucionesActuales.reduce((sum, dist) => sum + (parseFloat(dist.galones) || 0), 0);
    const galonesCargados = parseFloat(consumoOriginal.galones || 0);
    const galonesRestantes = galonesCargados - galonesYaDistribuidos;

    if (isNaN(galonesASuministrar) || galonesASuministrar <= 0) {
         mostrarNotificacion("Ingrese galones válidos.", "error");
         btnGuardarDist.disabled = false; btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución'; return;
    }
    if (galonesASuministrar > galonesRestantes + 0.001) { // Pequeña tolerancia para errores de redondeo
        mostrarNotificacion(`No puede distribuir ${galonesASuministrar.toFixed(2)} gal. Restantes: ${galonesRestantes.toFixed(2)} gal.`, "error", 5000);
        btnGuardarDist.disabled = false; btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución'; return;
    }

    const nuevaDistribucion = {
        maquina: document.getElementById('selectDistMaquinaria').value,
        galones: galonesASuministrar.toFixed(2),
        proyecto: document.getElementById('selectDistProyecto').value || "",
        descripcion: document.getElementById('distDescripcion').value || "",
        fechaRegistro: new Date().toISOString()
    };

    if (!nuevaDistribucion.maquina) {
        mostrarNotificacion("Seleccione la maquinaria.", "error");
         btnGuardarDist.disabled = false; btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución'; return;
    }

    try {
        const consumoDocRef = doc(db, "consumos", consumoId);
        await updateDoc(consumoDocRef, { distribuciones: arrayUnion(nuevaDistribucion) });
        mostrarNotificacion("Distribución guardada.", "exito");
        
        // Actualizar localmente y UI del modal
        const index = todosLosConsumos.findIndex(c => c.id === consumoId);
        if (index !== -1) {
            if (!todosLosConsumos[index].distribuciones) { todosLosConsumos[index].distribuciones = []; }
            todosLosConsumos[index].distribuciones.push(nuevaDistribucion);
            actualizarInfoDistribucionModal(todosLosConsumos[index]); 
        }
        document.getElementById('distribucionForm').reset();
        document.getElementById('selectDistMaquinaria').focus();
    } catch (error) {
        console.error("Error al guardar distribución:", error);
        mostrarNotificacion("No se pudo guardar la distribución.", "error");
    } finally {
        btnGuardarDist.disabled = false;
        btnGuardarDist.innerHTML = '<i class="fa-solid fa-plus"></i> Guardar Distribución';
    }
}

// --- Administración ---
async function agregarItemAdmin(tipo, inputElement) { /* ... (sin cambios desde la última versión correcta) ... */ }
function mostrarListasAdmin() { /* ... (sin cambios desde la última versión correcta) ... */ }
async function modificarItemAdmin(item, tipo) { /* ... (sin cambios desde la última versión correcta) ... */ }
async function borrarItemAdmin(item, tipo) { /* ... (sin cambios desde la última versión correcta) ... */ }

// --- Historial y Filtros ---
function manejarAccionesHistorial(e) { /* ... (sin cambios desde la última versión correcta) ... */ }
function obtenerConsumosFiltrados() { /* ... (sin cambios desde la última versión correcta) ... */ }
function cargarDatosParaModificar(id) { /* ... (sin cambios desde la última versión correcta) ... */ }
async function borrarConsumoHistorial(id) { /* ... (sin cambios desde la última versión correcta) ... */ }
function poblarFiltroDeMes() { /* ... (sin cambios desde la última versión correcta) ... */ }
function poblarFiltrosReportes() { /* ... (sin cambios desde la última versión correcta) ... */ }
function mostrarHistorialAgrupado(consumos) { /* ... (sin cambios desde la última versión correcta) ... */ }
function asignarSincronizacionDeFiltros() { /* ... (sin cambios desde la última versión correcta) ... */ }

// --- Reportes ---
function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... (sin cambios desde la última versión correcta) ... */ }
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };

// --- Autenticación ---
function handleLogin(e) { /* ... (sin cambios desde la última versión correcta) ... */ }
function handleLogout() { /* ... (sin cambios desde la última versión correcta) ... */ }

// --- Helper para actualizar modal de distribución ---
function actualizarInfoDistribucionModal(consumo) {
    if (!consumo) return;
    const distribuciones = consumo.distribuciones || []; 
    const galonesDistribuidos = distribuciones.reduce((sum, dist) => sum + (parseFloat(dist.galones) || 0), 0);
    const galonesCargados = parseFloat(consumo.galones || 0);
    const galonesRestantes = galonesCargados - galonesDistribuidos;

    document.getElementById('distInfoGalonesDistribuidos').textContent = galonesDistribuidos.toFixed(2);
    document.getElementById('distInfoGalonesRestantes').textContent = galonesRestantes.toFixed(2);
    
    const listaUl = document.getElementById('distribucionesAnterioresLista');
    listaUl.innerHTML = ''; 
    if(distribuciones.length === 0){
        listaUl.innerHTML = '<li>Aún no hay distribuciones registradas.</li>';
    } else {
        distribuciones.forEach(dist => {
            const li = document.createElement('li');
            li.textContent = `- ${dist.galones} gal a ${dist.maquina} ${dist.proyecto ? '('+dist.proyecto+')' : ''} ${dist.descripcion ? ': '+dist.descripcion : ''}`;
            listaUl.appendChild(li);
        });
    }
}

// --- Asignación de Eventos ---
function asignarEventosApp() {
    // Modal Principal
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    const consumoForm = document.getElementById('consumoForm'); 
    if(consumoForm) consumoForm.addEventListener('submit', guardarOActualizar);

    // Modal Distribución
    if (btnCerrarModalDistribucion) btnCerrarModalDistribucion.addEventListener('click', cerrarModalDistribucion);
    if (btnFinalizarDistribucion) btnFinalizarDistribucion.addEventListener('click', cerrarModalDistribucion);
    const formDistribucion = document.getElementById('distribucionForm');
    if (formDistribucion) formDistribucion.addEventListener('submit', guardarDistribucion);

    // Pestañas
    const btnReg = document.getElementById('btnTabRegistrar'); if(btnReg) btnReg.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    const btnRep = document.getElementById('btnTabReportes'); if(btnRep) btnRep.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    const btnHist = document.getElementById('btnTabHistorial'); if(btnHist) btnHist.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    const btnAdm = document.getElementById('btnTabAdmin'); if(btnAdm) btnAdm.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));

    // Impresión y Filtros
    document.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', (e) => { 
        const targetId = e.currentTarget.dataset.printTarget;
        const targetTab = document.getElementById(targetId);
        if (targetTab) { tabActivaParaImprimir = targetTab; targetTab.classList.add('printable-active'); window.print(); }
    }));
    window.onafterprint = () => { 
        if (tabActivaParaImprimir) { tabActivaParaImprimir.classList.remove('printable-active'); tabActivaParaImprimir = null; }
        document.getElementById('facturas-impresion').innerHTML = ''; 
    };
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => { 
        document.querySelectorAll('.filtro-sincronizado').forEach(filtro => {
            const valorOriginal = filtro.value;
            if(filtro.tagName === 'SELECT') filtro.value = 'todos'; else filtro.value = '';
            if (filtro.value !== valorOriginal) { filtro.dispatchEvent(new Event('change', { 'bubbles': true })); }
        });
        actualizarTodaLaUI();
    }));
    
    // Historial
    const histBody = document.getElementById('historialBody'); if(histBody) histBody.addEventListener('click', manejarAccionesHistorial);
    
    // Forms Admin
    const formChofer = document.getElementById('formAdminChofer'); if(formChofer) formChofer.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    const formPlaca = document.getElementById('formAdminPlaca'); if(formPlaca) formPlaca.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    const formDetalles = document.getElementById('formAdminDetallesVolqueta'); if(formDetalles) formDetalles.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); }); 
    const formMaquinaria = document.getElementById('formAdminMaquinaria'); if(formMaquinaria) formMaquinaria.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('maquinaria', document.getElementById('nuevaMaquinaria')); }); 
    const formEmpresa = document.getElementById('formAdminEmpresa'); if(formEmpresa) formEmpresa.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    const formProveedor = document.getElementById('formAdminProveedor'); if(formProveedor) formProveedor.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    const formProyecto = document.getElementById('formAdminProyecto'); if(formProyecto) formProyecto.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    // Acordeones
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => { 
        boton.addEventListener('click', function() { 
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if(panel){ // Verificar que el panel existe
                 if (panel.style.maxHeight) { panel.style.maxHeight = null; } 
                 else { panel.style.maxHeight = panel.scrollHeight + "px"; } 
            }
        }); 
    });
    asignarSincronizacionDeFiltros();
}

// --- Inicio de la Aplicación ---
function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}