import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCElg_et8_Z8ERTWo5tAwZJk2tb2ztUwlc", // Replace with your actual API key
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
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], maquinaria: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;

// ## Authentication and Initial Setup
// ---

onAuthStateChanged(auth, (user) => {
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if(btnLogout) btnLogout.style.display = 'block'; // Check if btnLogout exists
        if (!appInicializada) {
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'none'; // Check if btnLogout exists
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

// ## Modal Handling
// ---

const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal.querySelector('.close-button');
function abrirModal() { modal.style.display = 'block'; }
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); }

// ## Tab Navigation
// ---

function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("main-tab-link");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }

    const tabElement = document.getElementById(tabName);
    if(tabElement) tabElement.style.display = "block";

    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) {
        buttonToActivate.className += " active";
    }

    // Prepare for printing and handle sub-tabs
    document.querySelectorAll('.main-tab-content').forEach(tab => tab.classList.remove('printable-active'));
    if (tabElement) {
        tabElement.classList.add('printable-active');
        // Reset sub-tab of Historial if navigating to it
        if (tabName === 'tabHistorial') {
            openHistorialSubTab(null, 'subTabHistorialGeneral'); // Open the general one by default
        }
    }
}

function openHistorialSubTab(evt, subTabId) {
    let i, subtabcontent, subtablinks;
    subtabcontent = document.querySelectorAll('#tabHistorial .sub-tab-content');
    for (i = 0; i < subtabcontent.length; i++) {
        subtabcontent[i].style.display = "none";
    }
    subtablinks = document.querySelectorAll('#tabHistorial .sub-tab-link');
    for (i = 0; i < subtablinks.length; i++) {
        subtablinks[i].className = subtablinks[i].className.replace(" active", "");
    }
    const subTabElement = document.getElementById(subTabId);
    if(subTabElement) subTabElement.style.display = "block";

    if (evt) {
        evt.currentTarget.className += " active";
    } else {
        const btnToActivate = document.querySelector(`.sub-tab-link[data-subtab="${subTabId}"]`);
        if (btnToActivate) btnToActivate.className += " active";
    }
}

// ## Data Loading and UI Updates
// ---

async function cargarDatosIniciales() {
    const loadingMsg = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if(loadingMsg) loadingMsg.style.display = 'block';
    if(loaderContainer) loaderContainer.style.display = 'flex';

    try {
        const [
            consumosRes, choferesRes, placasRes, detallesVolquetaRes,
            empresasRes, proveedoresRes, proyectosRes, maquinariaRes
        ] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))),
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))),
            getDocs(query(collection(db, "placas"), orderBy("nombre"))),
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))),
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))),
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))),
            getDocs(query(collection(db, "proyectos"), orderBy("nombre"))),
            getDocs(query(collection(db, "maquinaria"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = detallesVolquetaRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.empresas = empresasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proveedores = proveedoresRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proyectos = proyectosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.maquinaria = maquinariaRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        actualizarTodaLaUI();

    } catch (error) {
        console.error("Error cargando datos:", error);
        if(loadingMsg) loadingMsg.textContent = "Error al cargar datos. Revisa la consola (F12).";
    } finally {
        if(loaderContainer) loaderContainer.style.display = 'none';
    }
}

function actualizarTodaLaUI() {
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();
        const consumosFiltrados = obtenerConsumosFiltrados(); // Ensure this is called AFTER the function is defined

        // Update reports
        calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
        calcularYMostrarTotalesPorProveedor(consumosFiltrados);
        calcularYMostrarTotalesPorProyecto(consumosFiltrados);
        calcularYMostrarTotalesPorChofer(consumosFiltrados);
        calcularYMostrarTotales(consumosFiltrados); // Totales por Placa (Volqueta)

        // Update form selectors
        poblarSelectores();

        // Update admin lists
        mostrarListasAdmin();

        // Update history views
        mostrarHistorialAgrupado(consumosFiltrados);
        mostrarHistorialPorFactura(consumosFiltrados);

    } catch (error) {
        console.error("Error updating UI:", error);
        mostrarNotificacion("Error al actualizar la interfaz.", "error");
    }
}


function poblarSelectores() {
    const selectores = {
        choferes: document.getElementById('selectChofer'),
        placas: document.getElementById('selectVolqueta'),
        detallesVolqueta: document.getElementById('selectDetallesVolqueta'),
        maquinaria: document.getElementById('selectMaquinariaDestino'),
        empresas: document.getElementById('selectEmpresa'),
        proveedores: document.getElementById('selectProveedor'),
        proyectos: document.getElementById('selectProyecto')
    };
    // --- CORRECTED TITULOS OBJECT ---
    const titulos = {
        choferes: '--- Chofer ---',
        placas: '--- Placa ---',
        detallesVolqueta: '--- Detalles Volqueta ---',
        maquinaria: '--- Maquinaria ---', // Corrected syntax if there was an error here
        empresas: '--- Empresa ---',
        proveedores: '--- Proveedor ---',
        proyectos: '--- Proyecto ---' // No comma after the last item
    };
    // --- END CORRECTION ---
    for (const tipo in selectores) {
        const select = selectores[tipo];
        if (!select || !listasAdmin[tipo]) continue; // Check if list exists

        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`;

        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));
        listaOrdenada.forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });

        select.value = valorActual; // Restore previous value if exists
    }
}

function reiniciarFormulario() {
    const form = document.getElementById('consumoForm');
    if(form) form.reset();

    document.getElementById('registroId').value = '';
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('formularioTitulo').textContent = 'Nuevo Registro';
    poblarSelectores(); // Repopulate selectors

    // Reset dynamic form visibility and state
    document.getElementById('camposCompra').style.display = 'block';
    document.getElementById('camposTransferencia').style.display = 'none';
    document.getElementById('tipoRegistro').value = 'compra';
    document.getElementById('facturaOrigen').value = '';
    document.getElementById('infoFacturaCargada').style.display = 'none';
    document.getElementById('errorFacturaCargada').style.display = 'none';
    document.getElementById('saldoManualVolqueta').value = '';

    // Reset required attributes handled by JS
    document.getElementById('selectProveedor').required = true;
    document.getElementById('costo').required = true;
    document.getElementById('selectMaquinariaDestino').required = false;
    document.getElementById('selectEmpresa').required = true; // Restore required for Empresa

    // Re-enable potentially disabled fields
    document.getElementById('selectVolqueta').disabled = false;
    document.getElementById('selectChofer').disabled = false;

    // Ensure optional fields are visible again
    document.querySelectorAll('.campo-opcional-transferencia').forEach(el => el.style.display = 'block'); // Or 'flex'
}

// ## Operaciones CRUD: Consumos
// ---

async function guardarOActualizar(e) {
    e.preventDefault();
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const id = document.getElementById('registroId').value;
    const tipoRegistro = document.getElementById('tipoRegistro').value;

    const datosConsumo = {
        tipoRegistro: tipoRegistro,
        volqueta: document.getElementById('selectVolqueta').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        galones: parseFloat(document.getElementById('galones').value) || 0,
        chofer: document.getElementById('selectChofer').value,
        proyecto: document.getElementById('selectProyecto').value,
        empresa: document.getElementById('selectEmpresa').value,
        descripcion: document.getElementById('descripcion').value,
        detallesVolqueta: document.getElementById('selectDetallesVolqueta').value || "",
        kilometraje: document.getElementById('kilometraje').value || null
    };

    if (tipoRegistro === 'compra') {
        datosConsumo.numeroFactura = document.getElementById('numeroFactura').value;
        datosConsumo.proveedor = document.getElementById('selectProveedor').value;
        datosConsumo.costo = parseFloat(document.getElementById('costo').value) || 0;
        datosConsumo.maquinariaDestino = null;
        datosConsumo.facturaOrigen = null;
        datosConsumo.saldoManualVolqueta = null;
    } else { // 'transferencia'
        datosConsumo.numeroFactura = null; // No aplica a la transferencia en sí
        datosConsumo.proveedor = "Transferencia Interna";
        datosConsumo.costo = 0;
        datosConsumo.maquinariaDestino = document.getElementById('selectMaquinariaDestino').value;
        datosConsumo.galones = -Math.abs(datosConsumo.galones); // Guardar como negativo
        datosConsumo.facturaOrigen = document.getElementById('facturaOrigen').value.trim() || null;
        datosConsumo.saldoManualVolqueta = parseFloat(document.getElementById('saldoManualVolqueta').value) || null;
        // Clear optional fields if they were hidden
        datosConsumo.hora = '';
        datosConsumo.detallesVolqueta = '';
        datosConsumo.kilometraje = null;
        datosConsumo.empresa = '';
    }

    // Validación básica
    if (!datosConsumo.chofer || !datosConsumo.volqueta || !datosConsumo.proyecto || !datosConsumo.fecha || datosConsumo.galones === 0) {
        mostrarNotificacion("Complete Fecha, Chofer, Placa, Proyecto y Galones (distinto de 0).", "error");
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
        return;
    }
     // Validación específica para transferencia
    if (tipoRegistro === 'transferencia' && !datosConsumo.maquinariaDestino) {
        mostrarNotificacion("Seleccione la Maquinaria Abastecida.", "error");
         btnGuardar.disabled = false;
         btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
         return;
    }

    try {
        if (id) {
            await updateDoc(doc(db, "consumos", id), datosConsumo);
            mostrarNotificacion("Registro actualizado con éxito", "exito");
        } else {
            await addDoc(collection(db, "consumos"), datosConsumo);
            mostrarNotificacion("Registro guardado con éxito", "exito");
        }
        reiniciarFormulario();
        cerrarModal();
        await cargarDatosIniciales(); // Recargar datos
    } catch (error) {
        console.error("Error saving to Firestore:", error);
        mostrarNotificacion(`Error al guardar: ${error.message}`, "error", 5000);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
    }
}

// *** DEFINICIÓN DE manejarAccionesHistorial ***
function manejarAccionesHistorial(e) {
    const target = e.target.closest('button'); // Busca el botón más cercano al clic
    if (!target) return; // Si no se hizo clic en un botón, salir
    const id = target.dataset.id; // Obtener el ID del registro desde el atributo data-id
    if (!id) return; // Si el botón no tiene ID, salir
    if (target.classList.contains('btn-modificar')) {
        cargarDatosParaModificar(id); // Llamar a la función para modificar
    }
    if (target.classList.contains('btn-borrar')) {
        borrarConsumoHistorial(id); // Llamar a la función para borrar
    }
}

// *** DEFINICIÓN DE obtenerConsumosFiltrados ***
function obtenerConsumosFiltrados() {
    const obtenerValorFiltro = (syncId) => document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`)?.value || (syncId.startsWith('filtroFecha') ? '' : 'todos'); // Added ?. for safety
    const mes = obtenerValorFiltro('filtroMes');
    const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
    const fechaFin = obtenerValorFiltro('filtroFechaFin');
    const chofer = obtenerValorFiltro('filtroChofer');
    const proveedor = obtenerValorFiltro('filtroProveedor');
    const empresa = obtenerValorFiltro('filtroEmpresa');
    const proyecto = obtenerValorFiltro('filtroProyecto');
    let consumosFiltrados = todosLosConsumos;

    try { // Added try-catch for robustness
        if (fechaInicio && fechaFin) {
            if (fechaFin < fechaInicio) {
                mostrarNotificacion("La fecha de fin no puede ser anterior a la de inicio.", "error");
                return []; // Return empty array on error
            }
            consumosFiltrados = consumosFiltrados.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin);
        } else if (fechaInicio) { // Filter by single date if only start date is provided
            consumosFiltrados = consumosFiltrados.filter(c => c.fecha === fechaInicio);
        } else if (mes !== 'todos') {
            consumosFiltrados = consumosFiltrados.filter(c => c.fecha && c.fecha.startsWith(mes));
        }

        // Apply other filters
        if (chofer !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.chofer === chofer); }
        if (proveedor !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proveedor === proveedor); }
        if (empresa !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.empresa === empresa); }
        if (proyecto !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proyecto === proyecto); }

    } catch (error) {
        console.error("Error applying filters:", error);
        mostrarNotificacion("Error al aplicar filtros.", "error");
        return todosLosConsumos; // Return unfiltered list on error
    }
    return consumosFiltrados;
}


function cargarDatosParaModificar(id) {
    const consumo = todosLosConsumos.find(c => c.id === id);
    if (!consumo) {
        mostrarNotificacion("Registro no encontrado.", "error");
        return;
    }

    const tipoRegistro = consumo.tipoRegistro || 'compra';
    const selectTipo = document.getElementById('tipoRegistro');
    selectTipo.value = tipoRegistro;

    // Disparar evento change DESPUÉS de establecer el valor para asegurar que la UI se actualice
    setTimeout(() => {
        selectTipo.dispatchEvent(new Event('change'));

         // --- NUEVO: Ajustar visibilidad después de cargar ---
        const camposOpcionales = document.querySelectorAll('.campo-opcional-transferencia');
        if (tipoRegistro === 'transferencia') {
            camposOpcionales.forEach(el => el.style.display = 'none');
            document.getElementById('selectEmpresa').required = false;
        } else {
            camposOpcionales.forEach(el => el.style.display = 'block'); // O 'flex'
            document.getElementById('selectEmpresa').required = true;
        }
        // --- FIN NUEVO ---

    }, 0);

    document.getElementById('registroId').value = consumo.id;
    document.getElementById('fecha').value = consumo.fecha;
    document.getElementById('hora').value = consumo.hora || ''; // Fill even if hidden, might be useful if type changes
    document.getElementById('selectChofer').value = consumo.chofer;
    document.getElementById('selectVolqueta').value = consumo.volqueta;
    document.getElementById('galones').value = Math.abs(consumo.galones || 0); // Mostrar valor positivo
    document.getElementById('descripcion').value = consumo.descripcion;
    document.getElementById('selectEmpresa').value = consumo.empresa || ""; // Fill even if hidden
    document.getElementById('selectProyecto').value = consumo.proyecto || "";
    document.getElementById('selectDetallesVolqueta').value = consumo.detallesVolqueta || ""; // Fill even if hidden
    document.getElementById('kilometraje').value = consumo.kilometraje || ""; // Fill even if hidden

    if (tipoRegistro === 'compra') {
        document.getElementById('numeroFactura').value = consumo.numeroFactura || '';
        document.getElementById('selectProveedor').value = consumo.proveedor || "";
        document.getElementById('costo').value = consumo.costo || 0;
        // Limpiar campos de transferencia por si acaso
        document.getElementById('facturaOrigen').value = '';
        document.getElementById('selectMaquinariaDestino').value = '';
        document.getElementById('saldoManualVolqueta').value = '';
    } else { // 'transferencia'
        document.getElementById('selectMaquinariaDestino').value = consumo.maquinariaDestino || '';
        document.getElementById('facturaOrigen').value = consumo.facturaOrigen || '';
        document.getElementById('saldoManualVolqueta').value = consumo.saldoManualVolqueta !== null ? consumo.saldoManualVolqueta : '';
        // Limpiar campos de compra
        document.getElementById('numeroFactura').value = '';
        document.getElementById('selectProveedor').value = '';
        document.getElementById('costo').value = '';
    }

    // Asegurar que los campos potencialmente deshabilitados por búsqueda estén habilitados
    document.getElementById('selectVolqueta').disabled = false;
    document.getElementById('selectChofer').disabled = false;

    openMainTab(null, 'tabRegistrar');
    abrirModal();
}

async function borrarConsumoHistorial(id) {
    if (confirm('¿Seguro que quieres borrar este registro? Esta acción no se puede deshacer.')) {
        try {
            await deleteDoc(doc(db, "consumos", id));
            mostrarNotificacion("Registro borrado con éxito.", "exito");
            await cargarDatosIniciales(); // Recargar datos
        } catch (error) {
            console.error("Error deleting record:", error);
            mostrarNotificacion("No se pudo borrar el registro.", "error");
        }
    }
}

// ## Búsqueda de Factura para Transferencias
// ---

async function buscarYPrecargarFactura() {
    const numFactura = document.getElementById('facturaOrigen').value.trim();
    const infoMsg = document.getElementById('infoFacturaCargada');
    const errorMsg = document.getElementById('errorFacturaCargada');
    infoMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    // Reactivar campos antes de buscar
    document.getElementById('selectVolqueta').disabled = false;
    document.getElementById('selectChofer').disabled = false;


    if (!numFactura) {
        errorMsg.textContent = "Ingrese un número de factura.";
        errorMsg.style.display = 'block';
        return;
    }

    // Buscar el registro de compra original en los datos cargados
    const cargaOriginal = todosLosConsumos.find(c => (c.tipoRegistro === 'compra' || !c.tipoRegistro) && c.numeroFactura === numFactura); // Incluir registros antiguos sin tipoRegistro

    if (cargaOriginal) {
        // Precargar datos
        document.getElementById('selectVolqueta').value = cargaOriginal.volqueta || '';
        document.getElementById('selectChofer').value = cargaOriginal.chofer || '';
        // Opcional: Deshabilitar estos campos
        // document.getElementById('selectVolqueta').disabled = true;
        // document.getElementById('selectChofer').disabled = true;

        infoMsg.textContent = `Datos cargados: Volqueta ${cargaOriginal.volqueta}, Fecha ${cargaOriginal.fecha}`;
        infoMsg.style.display = 'block';
        document.getElementById('selectMaquinariaDestino').focus();
    } else {
        errorMsg.textContent = `No se encontró Carga con Factura N° ${numFactura}.`;
        errorMsg.style.display = 'block';
        // Limpiar datos potencialmente precargados
        document.getElementById('selectVolqueta').value = '';
        document.getElementById('selectChofer').value = '';
    }
}


// ## Operaciones CRUD: Listas Admin (Choferes, Placas, etc.)
// ---

async function agregarItemAdmin(tipo, inputElement) {
    const valor = (tipo === 'placas') ? inputElement.value.trim().toUpperCase() : inputElement.value.trim();
    if (valor) {
        if (!listasAdmin[tipo]) {
            console.error(`Error: listasAdmin['${tipo}'] no está definido.`);
            mostrarNotificacion("Error interno al agregar.", "error");
            return;
        }
        const listaNombres = listasAdmin[tipo].map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(valor.toUpperCase())) { mostrarNotificacion(`"${valor}" ya existe.`, "error"); return; }
        try {
            await addDoc(collection(db, tipo), { nombre: valor });
            mostrarNotificacion(`Elemento agregado correctamente.`, "exito");
            inputElement.value = '';
            await cargarDatosIniciales(); // Recargar todos los datos
        } catch (error) {
            console.error("Error adding admin item:", error);
            mostrarNotificacion("No se pudo agregar el elemento.", "error");
        }
    }
}

async function modificarItemAdmin(item, tipo) {
    const valorActual = item.nombre;
    const nuevoValor = prompt(`Modificar "${valorActual}":`, valorActual);
    if (!nuevoValor || nuevoValor.trim() === '' || nuevoValor.trim() === valorActual) return;

    const valorFormateado = (tipo === 'placas') ? nuevoValor.trim().toUpperCase() : nuevoValor.trim();

    // Verificar si el nuevo nombre ya existe (ignorando mayúsculas/minúsculas)
    if (listasAdmin[tipo] && listasAdmin[tipo].some(i => i.id !== item.id && i.nombre.toUpperCase() === valorFormateado.toUpperCase())) {
        mostrarNotificacion(`"${valorFormateado}" ya existe.`, "error");
        return;
    }

    const propiedad = { // Mapea tipo admin al nombre del campo en 'consumos'
        placas: 'volqueta', choferes: 'chofer', empresas: 'empresa', proveedores: 'proveedor',
        proyectos: 'proyecto', detallesVolqueta: 'detallesVolqueta', maquinaria: 'maquinariaDestino'
    }[tipo];

    if (!propiedad) {
        console.error("Unknown admin item type:", tipo);
        mostrarNotificacion("Error interno al modificar.", "error");
        return;
    }

    if (confirm(`¿Actualizar "${valorActual}" a "${valorFormateado}"? Esto modificará este elemento Y actualizará TODOS los registros de consumo asociados.`)) {
        try {
            // 1. Actualizar el item admin
            await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado });

            // 2. Encontrar y actualizar registros de consumo relacionados
            const updates = todosLosConsumos
                .filter(consumo => consumo[propiedad] === valorActual)
                .map(consumo => updateDoc(doc(db, "consumos", consumo.id), { [propiedad]: valorFormateado }));

            await Promise.all(updates);

            await cargarDatosIniciales(); // Recargar datos para reflejar cambios en todos lados
            mostrarNotificacion("Actualización completada.", "exito");

        } catch(e) {
            console.error("Error modifying admin item or related records:", e);
            mostrarNotificacion("Error durante la actualización.", "error");
        }
    }
}

async function borrarItemAdmin(item, tipo) {
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "maquinaria", "empresas", "proveedores", "proyectos"];
    if (!coleccionesPermitidas.includes(tipo)) {
        console.error("Attempt to delete from disallowed collection:", tipo);
        mostrarNotificacion("Error interno al borrar.", "error");
        return;
    }

    if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) {
        try {
            await deleteDoc(doc(db, tipo, item.id));
            mostrarNotificacion("Elemento borrado.", "exito");
            await cargarDatosIniciales(); // Recargar datos
        } catch(e) {
            console.error("Error deleting admin item:", e);
            mostrarNotificacion("No se pudo borrar.", "error");
        }
    }
}

function mostrarListasAdmin() {
    const contenedores = {
        choferes: 'listaChoferes', placas: 'listaPlacas', detallesVolqueta: 'listaDetallesVolqueta',
        maquinaria: 'listaMaquinaria', empresas: 'listaEmpresas', proveedores: 'listaProveedores',
        proyectos: 'listaProyectos'
    };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul) continue;
        ul.innerHTML = ''; // Limpiar lista

        if (!listasAdmin[tipo] || listasAdmin[tipo].length === 0) {
            ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`;
            continue;
        }

        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));

        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id;
            li.innerHTML = `<span>${item.nombre}</span>
                          <div>
                              <button class="btn-accion btn-modificar button-warning" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button>
                              <button class="btn-accion btn-borrar" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button>
                          </div>`;
            li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
            li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}

// ## Lógica de Reportes y Visualización
// ---

function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) {
    const resumenBody = document.getElementById(bodyId);
    const resumenFooter = document.getElementById(footerId);
    if (!resumenBody || !resumenFooter) return;

    resumenBody.innerHTML = '';
    resumenFooter.innerHTML = '';
    const totales = {};

    consumos.forEach(c => {
        const clave = (categoria === 'volqueta') ? c.volqueta : c[categoria];
        if (!clave) return;

        if (!totales[clave]) totales[clave] = { totalGalones: 0, totalCosto: 0 };

        const galones = parseFloat(c.galones) || 0;
        const costo = parseFloat(c.costo) || 0;

        totales[clave].totalGalones += galones;
        totales[clave].totalCosto += costo;
    });

    if (Object.keys(totales).length === 0) {
        resumenBody.innerHTML = `<tr><td colspan="3" class="empty-state" style="text-align: center;">No hay datos.</td></tr>`;
        return;
    }

    const clavesOrdenadas = Object.keys(totales).sort((a, b) => a.localeCompare(b));
    let htmlBody = '', granTotalGalones = 0, granTotalCosto = 0;

    clavesOrdenadas.forEach(clave => {
        const total = totales[clave];
        htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td><td>$${total.totalCosto.toFixed(2)}</td></tr>`;
        granTotalGalones += total.totalGalones;
        granTotalCosto += total.totalCosto;
    });

    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td><td><strong>$${granTotalCosto.toFixed(2)}</strong></td></tr>`;
}

// Llamadas específicas para calcular reportes
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter');


function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody');
    const historialFooter = document.getElementById('historialFooter');
    if(!historialBody || !historialFooter) return;

    historialBody.innerHTML = '';
    historialFooter.innerHTML = '';
    const colspanCount = 16; // Número total de columnas <th>

    if (!consumos || consumos.length === 0) {
        historialBody.innerHTML = `<tr><td colspan="${colspanCount}" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`;
        return;
    }

    let totalGalonesNetos = 0, totalCostoCompras = 0;
    consumos.sort((a,b) => (b.fecha + (b.hora||'')) - (a.fecha + (a.hora||'')) || a.volqueta.localeCompare(b.volqueta));

    let mesAnioActual = "";

    consumos.forEach(consumo => {
        const galones = parseFloat(consumo.galones) || 0;
        const costo = parseFloat(consumo.costo) || 0;

        totalGalonesNetos += galones;
        totalCostoCompras += costo;

        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00');
        const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' });

        const fechaInicioFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaInicio"]')?.value;
        const fechaFinFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaFin"]')?.value;
        const filtroRangoActivo = fechaInicioFiltro && fechaFinFiltro;

        if (mesAnio !== mesAnioActual && !filtroRangoActivo) {
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr');
            filaGrupo.className = 'fila-grupo';
            filaGrupo.innerHTML = `<td colspan="${colspanCount}">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }

        const filaDato = document.createElement('tr');
        filaDato.dataset.id = consumo.id;

        filaDato.innerHTML = `
            <td class="no-print">
                <button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                <button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
            </td>
            <td>${consumo.fecha}</td>
            <td>${consumo.hora || ''}</td>
            <td>${consumo.numeroFactura || (consumo.tipoRegistro === 'transferencia' ? consumo.facturaOrigen || '' : '')}</td>
            <td>${consumo.chofer}</td>
            <td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td>
            <td>${consumo.kilometraje || ''}</td>
            <td>${consumo.maquinariaDestino || ''}</td>
            <td>${(consumo.tipoRegistro === 'transferencia' && consumo.saldoManualVolqueta !== null) ? consumo.saldoManualVolqueta.toFixed(2) : ''}</td>
            <td>${consumo.proveedor || ''}</td>
            <td>${consumo.proyecto || ''}</td>
            <td>${galones.toFixed(2)}</td>
            <td>$${costo.toFixed(2)}</td>
            <td>${consumo.empresa || ''}</td>
            <td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });

    // Ajustar colspan del footer
    const footerColspan = colspanCount - 6; // Ajustar según las columnas antes de los totales
    historialFooter.innerHTML = `<tr><td class="no-print"></td><td colspan="${footerColspan}" style="text-align: right;"><strong>TOTAL GALONES (NETO):</strong></td><td><strong>${totalGalonesNetos.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL (COMPRAS):</strong></td><td><strong>$${totalCostoCompras.toFixed(2)}</strong></td><td></td><td></td></tr>`;
}


function mostrarHistorialPorFactura(consumos) {
    const tbody = document.getElementById('historialFacturaBody');
    const tfoot = document.getElementById('historialFacturaFooter');
    if (!tbody) { console.error("historialFacturaBody not found"); return; }

    tbody.innerHTML = '';
    if (tfoot) tfoot.innerHTML = '';
    const colspanCount = 15; // Número de columnas <th> en esta tabla

    if (!consumos || consumos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${colspanCount}" class="empty-state">No hay datos para mostrar.</td></tr>`;
        return;
    }

    const compras = consumos.filter(c => c.tipoRegistro === 'compra' || !c.tipoRegistro).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const abastecimientosMap = new Map();
    consumos.filter(c => c.tipoRegistro === 'transferencia' && c.facturaOrigen).forEach(ab => {
        const facturaOrigen = ab.facturaOrigen;
        if (!abastecimientosMap.has(facturaOrigen)) {
            abastecimientosMap.set(facturaOrigen, []);
        }
        abastecimientosMap.get(facturaOrigen).push(ab);
    });

    if (compras.length === 0) {
         tbody.innerHTML = `<tr><td colspan="${colspanCount}" class="empty-state">No se encontraron Cargas con los filtros aplicados.</td></tr>`;
         return;
    }

    let totalGalonesTransferidosGeneral = 0; // Total general para el footer

    compras.forEach(compra => {
        if (!compra.numeroFactura) return; // Saltar compras sin número de factura en esta vista

        const filaCompra = document.createElement('tr');
        filaCompra.style.fontWeight = 'bold';
        filaCompra.dataset.factura = compra.numeroFactura;
        filaCompra.innerHTML = `
            <td class="no-print">
                 <button class="btn-accion btn-modificar button-warning" data-id="${compra.id}" title="Modificar Compra"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                 <button class="btn-accion btn-borrar" data-id="${compra.id}" title="Borrar Compra"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
            </td>
            <td>${compra.fecha}</td>
            <td>${compra.hora || ''}</td>
            <td>Compra (${compra.numeroFactura})</td>
            <td>${compra.chofer}</td>
            <td>${compra.volqueta}</td>
            <td>${compra.detallesVolqueta || ''}</td>
            <td>${compra.kilometraje || ''}</td>
            <td>-</td>
            <td>${compra.proveedor || ''}</td>
            <td>${compra.proyecto || ''}</td>
            <td>${(parseFloat(compra.galones) || 0).toFixed(2)}</td>
            <td>$${(parseFloat(compra.costo) || 0).toFixed(2)}</td>
            <td>-</td>
            <td>${compra.descripcion}</td>
        `;
        tbody.appendChild(filaCompra);

        const abastecimientosVinculados = abastecimientosMap.get(compra.numeroFactura) || [];
        abastecimientosVinculados.sort((a, b) => (a.fecha + (a.hora||'')) - (b.fecha + (b.hora||'')));

        abastecimientosVinculados.forEach(ab => {
            const filaAb = document.createElement('tr');
            filaAb.classList.add('fila-abastecimiento');
            const galonesAb = parseFloat(ab.galones) || 0;
            totalGalonesTransferidosGeneral += galonesAb; // Acumular para total general

            filaAb.innerHTML = `
                <td class="no-print">
                    <button class="btn-accion btn-modificar button-warning" data-id="${ab.id}" title="Modificar Abastecimiento"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                    <button class="btn-accion btn-borrar" data-id="${ab.id}" title="Borrar Abastecimiento"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
                </td>
                <td><i class="fas fa-level-up-alt fa-rotate-90"></i>${ab.fecha}</td>
                <td>${ab.hora || ''}</td>
                <td>Abastecimiento</td>
                <td>${ab.chofer}</td>
                <td>${ab.volqueta}</td>
                <td>${ab.detallesVolqueta || ''}</td>
                <td>${ab.kilometraje || ''}</td>
                <td>${ab.maquinariaDestino || ''}</td>
                <td>-</td>
                <td>${ab.proyecto || ''}</td>
                <td>${galonesAb.toFixed(2)}</td>
                <td>$0.00</td>
                <td>${(ab.saldoManualVolqueta !== null) ? ab.saldoManualVolqueta.toFixed(2) : ''}</td>
                <td>${ab.descripcion}</td>
            `;
            tbody.appendChild(filaAb);
        });
    });
     // Opcional: Añadir footer con totales para esta vista
     if (tfoot) {
         const footerColspan = colspanCount - 5; // Ajustar según columnas antes de total galones
         tfoot.innerHTML = `<tr><td class="no-print"></td><td colspan="${footerColspan}" style="text-align:right;"><strong>TOTAL GALONES ABASTECIDOS (FILTRADO):</strong></td><td><strong>${totalGalonesTransferidosGeneral.toFixed(2)}</strong></td><td></td><td></td><td></td><td></td></tr>`;
     }
}


// ## Lógica de Filtros
// ---

function poblarFiltroDeMes() {
    const filtros = document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]');
    const mesesUnicos = [...new Set(todosLosConsumos.map(c => c.fecha ? c.fecha.substring(0, 7) : null))].filter(Boolean);
    mesesUnicos.sort().reverse();
    filtros.forEach(filtroSelect => {
        const valorSeleccionado = filtroSelect.value;
        filtroSelect.innerHTML = '<option value="todos">Todos los Meses</option>';
        mesesUnicos.forEach(mes => {
            const [year, month] = mes.split('-');
            const fechaMes = new Date(Date.UTC(year, month - 1, 1));
            const nombreMes = fechaMes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' });
            const opcion = document.createElement('option');
            opcion.value = mes;
            opcion.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
            filtroSelect.appendChild(opcion);
        });
        filtroSelect.value = mesesUnicos.includes(valorSeleccionado) ? valorSeleccionado : 'todos';
    });
}

function poblarFiltrosReportes() {
    const tipos = { choferes: 'filtroChofer', proveedores: 'filtroProveedor', empresas: 'filtroEmpresa', proyectos: 'filtroProyecto' };
    const titulos = { choferes: 'Todos los Choferes', proveedores: 'Todos los Proveedores', empresas: 'Todas las Empresas', proyectos: 'Todos los Proyectos' };
    for (const tipo in tipos) {
        if (!listasAdmin[tipo]) continue;
        const syncId = tipos[tipo];
        const selects = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
        selects.forEach(select => {
            const valorActual = select.value;
            select.innerHTML = `<option value="todos">${titulos[tipo]}</option>`;
            const listaOrdenada = [...listasAdmin[tipo]].sort((a,b)=>a.nombre.localeCompare(b.nombre));
            listaOrdenada.forEach(item => {
                select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`;
            });
            select.value = listasAdmin[tipo].some(i => i.nombre === valorActual) ? valorActual : 'todos';
        });
    }
}

function asignarSincronizacionDeFiltros() {
    const filtros = document.querySelectorAll('.filtro-sincronizado');
    filtros.forEach(filtro => {
        filtro.addEventListener('change', (e) => {
            const syncId = e.target.dataset.syncId;
            const newValue = e.target.value;
            document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`).forEach(f => {
                if (f !== e.target) { f.value = newValue; }
            });

            if (syncId === 'filtroMes' && newValue !== 'todos') {
                document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroFechaInicio"], .filtro-sincronizado[data-sync-id="filtroFechaFin"]').forEach(el => el.value = '');
            } else if ((syncId === 'filtroFechaInicio' || syncId === 'filtroFechaFin') && newValue !== '') {
                document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]').forEach(el => el.value = 'todos');
            }
        });
    });
}

// ## Manejadores de Autenticación
// ---

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => { /* onAuthStateChanged maneja la UI */ })
        .catch(error => {
            console.error("Login error:", error.code);
            mostrarNotificacion("Credenciales incorrectas.", "error");
        });
}
function handleLogout() {
    signOut(auth).catch(error => {
        console.error("Logout error:", error);
        mostrarNotificacion("Error al cerrar sesión: " + error.message, "error");
    });
}

// ## Asignación de Eventos e Inicialización de la App
// ---

function asignarEventosApp() {
    // Botones del Modal
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);

    // Botones de Pestañas Principales
    document.getElementById('btnTabRegistrar')?.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    document.getElementById('btnTabReportes')?.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    document.getElementById('btnTabHistorial')?.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    document.getElementById('btnTabAdmin')?.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));

    // Formularios
    document.getElementById('consumoForm')?.addEventListener('submit', guardarOActualizar);
    document.getElementById('formAdminChofer')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    document.getElementById('formAdminPlaca')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    document.getElementById('formAdminDetallesVolqueta')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); });
    document.getElementById('formAdminEmpresa')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    document.getElementById('formAdminProveedor')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    document.getElementById('formAdminProyecto')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    document.getElementById('formAdminMaquinaria')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('maquinaria', document.getElementById('nuevaMaquinaria')); });

    // Botones de Impresión
    document.querySelectorAll('.btn-print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.printTarget;
            const targetTab = document.getElementById(targetId);
            if (targetTab) {
                tabActivaParaImprimir = targetId; // Guardar ID de la pestaña que se imprime
                // Asegurar que la sub-pestaña correcta esté visible si se imprime desde Historial
                if(targetId === 'tabHistorial') {
                   const activeSubTab = document.querySelector('#tabHistorial .sub-tab-link.active')?.dataset.subtab || 'subTabHistorialGeneral';
                   document.querySelectorAll('#tabHistorial .sub-tab-content').forEach(el => el.classList.remove('printable-active'));
                   document.getElementById(activeSubTab)?.classList.add('printable-active');
                } else {
                    document.querySelectorAll('.main-tab-content').forEach(tab => tab.classList.remove('printable-active'));
                    targetTab.classList.add('printable-active');
                }
                window.print();
            }
        });
    });

    window.onafterprint = () => {
        // Limpiar clases de impresión
        document.querySelectorAll('.main-tab-content, .sub-tab-content').forEach(el => el.classList.remove('printable-active'));
        if(document.getElementById('facturas-impresion')) document.getElementById('facturas-impresion').innerHTML = '';

        // Restaurar la pestaña que estaba activa antes de imprimir
        if (tabActivaParaImprimir) {
            const botonTabActiva = document.getElementById(`btnTab${tabActivaParaImprimir.replace('tab','')}`);
            if (botonTabActiva) {
                 openMainTab(null, tabActivaParaImprimir); // Reabrir pestaña sin evento click
                 // Asegurar que el botón se vea activo visualmente
                 document.querySelectorAll('.main-tab-link').forEach(btn => btn.classList.remove('active'));
                 botonTabActiva.classList.add('active');
            }
            tabActivaParaImprimir = null;
        }
    };

    // Botones de Filtro (aplicar/limpiar)
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-sincronizado').forEach(filtro => {
            const isSelect = filtro.tagName === 'SELECT';
            const defaultValue = isSelect ? 'todos' : '';
            if (filtro.value !== defaultValue) {
                 filtro.value = defaultValue;
                 // Disparar evento change para que los filtros sincronizados se limpien y se resuelva la oposición fecha/mes
                 if(isSelect || filtro.type === 'date') {
                    filtro.dispatchEvent(new Event('change', { 'bubbles': true }));
                 }
            }
        });
        actualizarTodaLaUI(); // Actualizar UI después de limpiar
    }));

    // Acciones de tabla Historial (delegación) - **CON VERIFICACIÓN**
    const historialBody = document.getElementById('historialBody');
    if (historialBody) {
        historialBody.addEventListener('click', manejarAccionesHistorial);
    } else {
        console.warn("Elemento 'historialBody' no encontrado al asignar eventos.");
    }
    const historialFacturaBody = document.getElementById('historialFacturaBody');
    if (historialFacturaBody) {
        historialFacturaBody.addEventListener('click', manejarAccionesHistorial);
    } else {
         console.warn("Elemento 'historialFacturaBody' no encontrado al asignar eventos.");
    }

    // Cambio Dinámico del Tipo de Formulario
    const selectTipoRegistro = document.getElementById('tipoRegistro');
    if (selectTipoRegistro) {
        selectTipoRegistro.addEventListener('change', (e) => {
            const tipo = e.target.value;
            const camposCompra = document.getElementById('camposCompra');
            const camposTransferencia = document.getElementById('camposTransferencia');
            const camposOpcionales = document.querySelectorAll('.campo-opcional-transferencia'); // Seleccionamos todos los divs a ocultar

            // Inputs required que cambian
            const inputProveedor = document.getElementById('selectProveedor');
            const inputCosto = document.getElementById('costo');
            const inputMaquinaria = document.getElementById('selectMaquinariaDestino');
            const inputEmpresa = document.getElementById('selectEmpresa'); // Añadido

            if (tipo === 'transferencia') {
                if (camposCompra) camposCompra.style.display = 'none';
                if (camposTransferencia) camposTransferencia.style.display = 'block';
                // Ocultar campos opcionales
                camposOpcionales.forEach(el => el.style.display = 'none');

                // Ajustar required
                if (inputProveedor) inputProveedor.required = false;
                if (inputCosto) inputCosto.required = false;
                if (inputMaquinaria) inputMaquinaria.required = true;
                if (inputEmpresa) inputEmpresa.required = false; // Empresa no es requerida en transferencia

                document.getElementById('facturaOrigen').focus();
            } else { // 'compra'
                if (camposCompra) camposCompra.style.display = 'block';
                if (camposTransferencia) camposTransferencia.style.display = 'none';
                 // Mostrar campos opcionales
                camposOpcionales.forEach(el => el.style.display = 'block'); // O 'flex' si usas flexbox

                // Ajustar required
                if (inputProveedor) inputProveedor.required = true;
                if (inputCosto) inputCosto.required = true;
                if (inputMaquinaria) inputMaquinaria.required = false;
                if (inputEmpresa) inputEmpresa.required = true; // Empresa es requerida en compra

                document.getElementById('numeroFactura').focus();
            }
            // Limpiar mensajes de búsqueda de factura
            document.getElementById('infoFacturaCargada').style.display = 'none';
            document.getElementById('errorFacturaCargada').style.display = 'none';
        });
    }

    // Botón y Enter para Búsqueda de Factura
    const btnBuscarFactura = document.getElementById('btnBuscarFactura');
    if (btnBuscarFactura) {
        btnBuscarFactura.addEventListener('click', buscarYPrecargarFactura);
    }
    const inputFacturaOrigen = document.getElementById('facturaOrigen');
    if (inputFacturaOrigen) {
        inputFacturaOrigen.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarYPrecargarFactura();
            }
        });
    }

    // Botones Acordeón
    document.querySelectorAll('.accordion-button').forEach(boton => {
        boton.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });

    // Botones Sub-Pestaña para Historial
     document.querySelectorAll('#tabHistorial .sub-tab-link').forEach(button => {
        button.addEventListener('click', (e) => {
            const subTabId = e.currentTarget.getAttribute('data-subtab');
            openHistorialSubTab(e, subTabId);
        });
    });

    // Inicializar filtros sincronizados
    asignarSincronizacionDeFiltros();
}

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
    // openMainTab(null, 'tabRegistrar'); // No es necesario si el HTML ya la define como activa
}

// Listeners Globales (Login/Logout)
document.getElementById('login-form')?.addEventListener('submit', handleLogin);
if(btnLogout) btnLogout.addEventListener('click', handleLogout);