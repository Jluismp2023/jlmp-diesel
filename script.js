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
    if(loaderContainer) loaderContainer.style.display = 'flex'; // Use flex for centering if needed

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
        const consumosFiltrados = obtenerConsumosFiltrados();
        
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
    const titulos = { 
        choferes: '--- Chofer ---', 
        placas: '--- Placa ---', 
        detallesVolqueta: '--- Detalles Volqueta ---', 
        maquinaria: '--- Maquinaria ---', 
        empresas: '--- Empresa ---', 
        proveedores: '--- Proveedor ---', 
        proyectos: '--- Proyecto ---' 
    };
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

    // Re-enable potentially disabled fields
    document.getElementById('selectVolqueta').disabled = false;
    document.getElementById('selectChofer').disabled = false;
}

// ## CRUD Operations: Consumos
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
        datosConsumo.numeroFactura = null; // No applies to transfer itself
        datosConsumo.proveedor = "Transferencia Interna"; 
        datosConsumo.costo = 0; 
        datosConsumo.maquinariaDestino = document.getElementById('selectMaquinariaDestino').value; 
        datosConsumo.galones = -Math.abs(datosConsumo.galones); // Save as negative
        datosConsumo.facturaOrigen = document.getElementById('facturaOrigen').value.trim() || null; 
        datosConsumo.saldoManualVolqueta = parseFloat(document.getElementById('saldoManualVolqueta').value) || null; 
    }

    // Basic validation
    if (!datosConsumo.chofer || !datosConsumo.volqueta || !datosConsumo.proyecto || !datosConsumo.fecha || datosConsumo.galones === 0) {
        mostrarNotificacion("Complete Fecha, Chofer, Placa, Proyecto y Galones (distinto de 0).", "error");
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
        return;
    }
     // Specific validation for transfer
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
        await cargarDatosIniciales(); // Reload data
    } catch (error) {
        console.error("Error saving to Firestore:", error);
        mostrarNotificacion(`Error al guardar: ${error.message}`, "error", 5000);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
    }
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
    
    // Trigger change event AFTER setting value to ensure UI updates
    setTimeout(() => {
        selectTipo.dispatchEvent(new Event('change'));
    }, 0);

    document.getElementById('registroId').value = consumo.id; 
    document.getElementById('fecha').value = consumo.fecha; 
    document.getElementById('hora').value = consumo.hora || ''; 
    document.getElementById('selectChofer').value = consumo.chofer; 
    document.getElementById('selectVolqueta').value = consumo.volqueta; 
    document.getElementById('galones').value = Math.abs(consumo.galones || 0); // Show positive value
    document.getElementById('descripcion').value = consumo.descripcion; 
    document.getElementById('selectEmpresa').value = consumo.empresa || ""; 
    document.getElementById('selectProyecto').value = consumo.proyecto || "";
    document.getElementById('selectDetallesVolqueta').value = consumo.detallesVolqueta || "";
    document.getElementById('kilometraje').value = consumo.kilometraje || "";

    if (tipoRegistro === 'compra') {
        document.getElementById('numeroFactura').value = consumo.numeroFactura || ''; 
        document.getElementById('selectProveedor').value = consumo.proveedor || ""; 
        document.getElementById('costo').value = consumo.costo || 0; 
        // Clear transfer fields just in case
        document.getElementById('facturaOrigen').value = '';
        document.getElementById('selectMaquinariaDestino').value = '';
        document.getElementById('saldoManualVolqueta').value = '';
    } else { // 'transferencia'
        document.getElementById('maquinariaDestino').value = consumo.maquinariaDestino || '';
        document.getElementById('facturaOrigen').value = consumo.facturaOrigen || ''; 
        document.getElementById('saldoManualVolqueta').value = consumo.saldoManualVolqueta !== null ? consumo.saldoManualVolqueta : ''; 
        // Clear purchase fields
        document.getElementById('numeroFactura').value = ''; 
        document.getElementById('selectProveedor').value = ''; 
        document.getElementById('costo').value = ''; 
    }

    // Ensure fields potentially disabled by lookup are enabled
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
            await cargarDatosIniciales(); // Reload data
        } catch (error) {
            console.error("Error deleting record:", error);
            mostrarNotificacion("No se pudo borrar el registro.", "error");
        }
    }
}

// ## Factura Lookup for Transfers
// ---

async function buscarYPrecargarFactura() {
    const numFactura = document.getElementById('facturaOrigen').value.trim();
    const infoMsg = document.getElementById('infoFacturaCargada');
    const errorMsg = document.getElementById('errorFacturaCargada');
    infoMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    
    // Re-enable fields before search
    document.getElementById('selectVolqueta').disabled = false;
    document.getElementById('selectChofer').disabled = false;


    if (!numFactura) {
        errorMsg.textContent = "Ingrese un número de factura.";
        errorMsg.style.display = 'block';
        return;
    }

    // Find the original purchase record in the loaded data
    const cargaOriginal = todosLosConsumos.find(c => (c.tipoRegistro === 'compra' || !c.tipoRegistro) && c.numeroFactura === numFactura); // Include old records without tipoRegistro

    if (cargaOriginal) {
        // Pre-fill data
        document.getElementById('selectVolqueta').value = cargaOriginal.volqueta || '';
        document.getElementById('selectChofer').value = cargaOriginal.chofer || '';
        // Optionally disable these fields
        // document.getElementById('selectVolqueta').disabled = true;
        // document.getElementById('selectChofer').disabled = true;

        infoMsg.textContent = `Datos cargados: Volqueta ${cargaOriginal.volqueta}, Fecha ${cargaOriginal.fecha}`;
        infoMsg.style.display = 'block';
        document.getElementById('selectMaquinariaDestino').focus(); 
    } else {
        errorMsg.textContent = `No se encontró Carga con Factura N° ${numFactura}.`;
        errorMsg.style.display = 'block';
        // Clear potentially pre-filled data
        document.getElementById('selectVolqueta').value = '';
        document.getElementById('selectChofer').value = '';
    }
}


// ## CRUD Operations: Admin Lists (Choferes, Placas, etc.)
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
            await cargarDatosIniciales(); // Reload all data
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
    
    // Check if new name already exists (case-insensitive)
    if (listasAdmin[tipo] && listasAdmin[tipo].some(i => i.id !== item.id && i.nombre.toUpperCase() === valorFormateado.toUpperCase())) {
        mostrarNotificacion(`"${valorFormateado}" ya existe.`, "error");
        return;
    }
    
    const propiedad = { // Maps admin type to the field name in 'consumos' collection
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
            // 1. Update the admin item itself
            await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); 
            
            // 2. Find and update related consumption records (Batch update might be better for large datasets)
            const updates = todosLosConsumos
                .filter(consumo => consumo[propiedad] === valorActual)
                .map(consumo => updateDoc(doc(db, "consumos", consumo.id), { [propiedad]: valorFormateado })); 
                
            await Promise.all(updates); 
            
            await cargarDatosIniciales(); // Reload data to reflect changes everywhere
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
    // Optional: Check if item is used in any consumption record before deleting
    // const propiedad = { ... }[tipo];
    // const isUsed = todosLosConsumos.some(c => c[propiedad] === item.nombre);
    // if (isUsed) { mostrarNotificacion(`"${item.nombre}" está en uso y no puede ser borrado.`, "error"); return; }

    if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) { 
        try { 
            await deleteDoc(doc(db, tipo, item.id)); 
            mostrarNotificacion("Elemento borrado.", "exito"); 
            await cargarDatosIniciales(); // Reload data
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
        ul.innerHTML = ''; // Clear list

        if (!listasAdmin[tipo] || listasAdmin[tipo].length === 0) { 
            ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; 
            continue; 
        }
        
        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));

        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            li.dataset.id = item.id; // Store ID for easier access if needed later
            li.innerHTML = `<span>${item.nombre}</span>
                          <div>
                              <button class="btn-accion btn-modificar button-warning" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button>
                              <button class="btn-accion btn-borrar" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button>
                          </div>`;
            // Add event listeners directly to buttons
            li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
            li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}

// ## Reporting and Display Logic
// ---

function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) {
    const resumenBody = document.getElementById(bodyId); 
    const resumenFooter = document.getElementById(footerId);
    if (!resumenBody || !resumenFooter) return; 
    
    resumenBody.innerHTML = ''; 
    resumenFooter.innerHTML = '';
    const totales = {};
    
    consumos.forEach(c => { 
        // Use 'volqueta' as the key if category is 'volqueta', otherwise use the specified category
        const clave = (categoria === 'volqueta') ? c.volqueta : c[categoria]; 
        if (!clave) return; // Skip if key is missing or empty
        
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
    
    const clavesOrdenadas = Object.keys(totales).sort((a, b) => a.localeCompare(b)); // Sort alphabetically
    let htmlBody = '', granTotalGalones = 0, granTotalCosto = 0;
    
    clavesOrdenadas.forEach(clave => { 
        const total = totales[clave]; 
        // Use <strong> for the key in the table cell for consistency
        htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td><td>$${total.totalCosto.toFixed(2)}</td></tr>`; 
        granTotalGalones += total.totalGalones; 
        granTotalCosto += total.totalCosto; 
    });
    
    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td><td><strong>$${granTotalCosto.toFixed(2)}</strong></td></tr>`;
}

// Specific report calculation calls
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
// Note: calcularYMostrarTotales now specifically calculates by 'volqueta' (Placa)
const calcularYMostrarTotales = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); 


function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody'); 
    const historialFooter = document.getElementById('historialFooter');
    if(!historialBody || !historialFooter) return;

    historialBody.innerHTML = ''; 
    historialFooter.innerHTML = '';
    const colspanCount = 16; // Update colspan based on number of columns

    if (!consumos || consumos.length === 0) { 
        historialBody.innerHTML = `<tr><td colspan="${colspanCount}" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`; 
        return; 
    }
    
    let totalGalonesNetos = 0, totalCostoCompras = 0;
    // Sort primarily by date (desc), then maybe by time if available, or placa as secondary
    consumos.sort((a,b) => (b.fecha + (b.hora||'')) - (a.fecha + (a.hora||'')) || a.volqueta.localeCompare(b.volqueta));
    
    let mesAnioActual = "";
    
    consumos.forEach(consumo => {
        const galones = parseFloat(consumo.galones) || 0;
        const costo = parseFloat(consumo.costo) || 0;

        totalGalonesNetos += galones; 
        totalCostoCompras += costo; 
        
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); // Ensure consistent date parsing
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
        // Add data-id to the row itself for potential future use
        filaDato.dataset.id = consumo.id; 
        
        filaDato.innerHTML = `
            <td class="no-print">
                <button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                <button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
            </td>
            <td>${consumo.fecha}</td>
            <td>${consumo.hora || ''}</td>
            <td>${consumo.numeroFactura || (consumo.tipoRegistro === 'transferencia' ? consumo.facturaOrigen || '' : '')}</td> <td>${consumo.chofer}</td>
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
    
    // Update footer with correct colspan
    const footerColspan = colspanCount - 6; // Adjust based on columns before totals
    historialFooter.innerHTML = `<tr><td class="no-print"></td><td colspan="${footerColspan}" style="text-align: right;"><strong>TOTAL GALONES (NETO):</strong></td><td><strong>${totalGalonesNetos.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL (COMPRAS):</strong></td><td><strong>$${totalCostoCompras.toFixed(2)}</strong></td><td></td><td></td></tr>`; // Added empty TDs to match count
}

function mostrarHistorialPorFactura(consumos) {
    const tbody = document.getElementById('historialFacturaBody');
    const tfoot = document.getElementById('historialFacturaFooter'); 
    if (!tbody) { console.error("historialFacturaBody not found"); return; }
    
    tbody.innerHTML = '';
    if (tfoot) tfoot.innerHTML = ''; 
    const colspanCount = 15; // Number of columns in this specific table

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
    
    let totalGalonesTransferidos = 0; // Optional total for footer

    compras.forEach(compra => {
        if (!compra.numeroFactura) return; // Skip purchases without invoice number in this view

        const filaCompra = document.createElement('tr');
        filaCompra.style.fontWeight = 'bold'; 
        filaCompra.dataset.factura = compra.numeroFactura; // Add factura as data attribute
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
        abastecimientosVinculados.sort((a, b) => (a.fecha + (a.hora||'')) - (b.fecha + (b.hora||''))); // Sort by date/time ascending

        abastecimientosVinculados.forEach(ab => {
            const filaAb = document.createElement('tr');
            filaAb.classList.add('fila-abastecimiento'); 
            const galonesAb = parseFloat(ab.galones) || 0; 
            totalGalonesTransferidos += galonesAb; // Accumulate (will be negative)

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
    // Optional: Add footer totals for this view
     if (tfoot) {
         const footerColspan = colspanCount - 4; // Adjust as needed
         tfoot.innerHTML = `<tr><td class="no-print"></td><td colspan="${footerColspan}" style="text-align:right;"><strong>TOTAL GALONES ABASTECIDOS:</strong></td><td><strong>${totalGalonesTransferidos.toFixed(2)}</strong></td><td></td><td></td><td></td></tr>`;
     }
}


// ## Filtering Logic
// ---

function poblarFiltroDeMes() { 
    const filtros = document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]'); 
    // Ensure fecha exists before substringing, filter out null/undefined results
    const mesesUnicos = [...new Set(todosLosConsumos.map(c => c.fecha ? c.fecha.substring(0, 7) : null))].filter(Boolean); 
    mesesUnicos.sort().reverse(); 
    filtros.forEach(filtroSelect => { 
        const valorSeleccionado = filtroSelect.value; 
        filtroSelect.innerHTML = '<option value="todos">Todos los Meses</option>'; 
        mesesUnicos.forEach(mes => { 
            const [year, month] = mes.split('-'); 
            const fechaMes = new Date(Date.UTC(year, month - 1, 1)); // Use UTC to avoid timezone issues
            const nombreMes = fechaMes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' }); 
            const opcion = document.createElement('option'); 
            opcion.value = mes; 
            opcion.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1); 
            filtroSelect.appendChild(opcion); 
        }); 
        // Restore selection if valid, otherwise default to 'todos'
        filtroSelect.value = mesesUnicos.includes(valorSeleccionado) ? valorSeleccionado : 'todos'; 
    }); 
}

function poblarFiltrosReportes() { 
    const tipos = { choferes: 'filtroChofer', proveedores: 'filtroProveedor', empresas: 'filtroEmpresa', proyectos: 'filtroProyecto' }; 
    const titulos = { choferes: 'Todos los Choferes', proveedores: 'Todos los Proveedores', empresas: 'Todas las Empresas', proyectos: 'Todos los Proyectos' }; 
    for (const tipo in tipos) { 
        if (!listasAdmin[tipo]) continue; // Skip if list type doesn't exist
        const syncId = tipos[tipo]; 
        const selects = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`); 
        selects.forEach(select => { 
            const valorActual = select.value; 
            select.innerHTML = `<option value="todos">${titulos[tipo]}</option>`; 
            // Sort list before adding options
            const listaOrdenada = [...listasAdmin[tipo]].sort((a,b)=>a.nombre.localeCompare(b.nombre));
            listaOrdenada.forEach(item => { 
                select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; 
            }); 
            // Restore selection if valid, otherwise default to 'todos'
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
            // Update other filters with the same syncId
            document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`).forEach(f => { 
                if (f !== e.target) { f.value = newValue; } 
            });
            
            // Clear opposite date/month filters
            if (syncId === 'filtroMes' && newValue !== 'todos') {
                document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroFechaInicio"], .filtro-sincronizado[data-sync-id="filtroFechaFin"]').forEach(el => el.value = '');
            } else if ((syncId === 'filtroFechaInicio' || syncId === 'filtroFechaFin') && newValue !== '') {
                document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]').forEach(el => el.value = 'todos');
            }
        });
    });
}

// ## Authentication Handlers
// ---

function handleLogin(e) { 
    e.preventDefault(); 
    const email = document.getElementById('login-email').value; 
    const password = document.getElementById('login-password').value; 
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => { /* onAuthStateChanged handles UI */ })
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

// ## Event Listeners and App Initialization
// ---

function asignarEventosApp() {
    // Modal buttons
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    
    // Main Tab buttons
    document.getElementById('btnTabRegistrar')?.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    document.getElementById('btnTabReportes')?.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    document.getElementById('btnTabHistorial')?.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    document.getElementById('btnTabAdmin')?.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    // Forms
    document.getElementById('consumoForm')?.addEventListener('submit', guardarOActualizar);
    document.getElementById('formAdminChofer')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    document.getElementById('formAdminPlaca')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    document.getElementById('formAdminDetallesVolqueta')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); });
    document.getElementById('formAdminEmpresa')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    document.getElementById('formAdminProveedor')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    document.getElementById('formAdminProyecto')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    document.getElementById('formAdminMaquinaria')?.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('maquinaria', document.getElementById('nuevaMaquinaria')); });

    // Print buttons
    document.querySelectorAll('.btn-print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.printTarget;
            const targetTab = document.getElementById(targetId);
            if (targetTab) {
                tabActivaParaImprimir = targetId; // Save ID of the tab being printed
                // Ensure correct sub-tab is visible if printing from Historial
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
        // Clean up print classes
        document.querySelectorAll('.main-tab-content, .sub-tab-content').forEach(el => el.classList.remove('printable-active'));
        document.getElementById('facturas-impresion').innerHTML = ''; // Clear if used
        
        // Restore the tab that was active before printing
        if (tabActivaParaImprimir) {
            const botonTabActiva = document.getElementById(`btnTab${tabActivaParaImprimir.replace('tab','')}`);
            if (botonTabActiva) {
                 openMainTab(null, tabActivaParaImprimir); // Reopen tab without click event
                 // Ensure the button visually remains active
                 document.querySelectorAll('.main-tab-link').forEach(btn => btn.classList.remove('active'));
                 botonTabActiva.classList.add('active');
            }
            tabActivaParaImprimir = null; 
        }
    };
    
    // Filter buttons (apply/clear) - Target all buttons with these IDs
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-sincronizado').forEach(filtro => {
            const isSelect = filtro.tagName === 'SELECT';
            const defaultValue = isSelect ? 'todos' : '';
            if (filtro.value !== defaultValue) {
                 filtro.value = defaultValue;
                 // Trigger change event for selects to sync and clear date/month opposition
                 if(isSelect || filtro.type === 'date') {
                    filtro.dispatchEvent(new Event('change', { 'bubbles': true })); 
                 }
            }
        });
        actualizarTodaLaUI(); // Update UI after clearing
    }));
    
    // History table actions (delegation)
    document.getElementById('historialBody')?.addEventListener('click', manejarAccionesHistorial);
    // Add delegation for the new factura history table as well
    document.getElementById('historialFacturaBody')?.addEventListener('click', manejarAccionesHistorial);

    // Dynamic Form Type Change
    const selectTipoRegistro = document.getElementById('tipoRegistro');
    if (selectTipoRegistro) {
        selectTipoRegistro.addEventListener('change', (e) => {
            const tipo = e.target.value;
            const camposCompra = document.getElementById('camposCompra');
            const camposTransferencia = document.getElementById('camposTransferencia');
            const inputProveedor = document.getElementById('selectProveedor');
            const inputCosto = document.getElementById('costo');
            const inputMaquinaria = document.getElementById('selectMaquinariaDestino');

            if (tipo === 'transferencia') {
                if (camposCompra) camposCompra.style.display = 'none';
                if (camposTransferencia) camposTransferencia.style.display = 'block';
                if (inputProveedor) inputProveedor.required = false;
                if (inputCosto) inputCosto.required = false;
                if (inputMaquinaria) inputMaquinaria.required = true;
                // Focus on the next logical field
                document.getElementById('facturaOrigen').focus();
            } else { // 'compra'
                if (camposCompra) camposCompra.style.display = 'block';
                if (camposTransferencia) camposTransferencia.style.display = 'none';
                if (inputProveedor) inputProveedor.required = true;
                if (inputCosto) inputCosto.required = true;
                if (inputMaquinaria) inputMaquinaria.required = false;
                // Focus on the first field of the purchase section
                document.getElementById('numeroFactura').focus();
            }
            // Clear factura lookup messages when type changes
            document.getElementById('infoFacturaCargada').style.display = 'none';
            document.getElementById('errorFacturaCargada').style.display = 'none';
        });
    }

    // Factura lookup button and enter key
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

    // Accordion buttons
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

    // Sub-Tab buttons for Historial
     document.querySelectorAll('#tabHistorial .sub-tab-link').forEach(button => {
        button.addEventListener('click', (e) => {
            const subTabId = e.currentTarget.getAttribute('data-subtab');
            openHistorialSubTab(e, subTabId);
        });
    });

    // Initialize synchronized filters
    asignarSincronizacionDeFiltros();
}

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
    openMainTab(null, 'tabRegistrar'); // Start on Registrar tab
}

// Global Event Listeners (Login/Logout)
document.getElementById('login-form')?.addEventListener('submit', handleLogin);
if(btnLogout) btnLogout.addEventListener('click', handleLogout);