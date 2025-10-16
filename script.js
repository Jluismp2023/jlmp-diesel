import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// ===== INICIO DE CÓDIGO NUEVO (IMPORTS PARA STORAGE) =====
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
// ===== FIN DE CÓDIGO NUEVO =====

const firebaseConfig = {
    apiKey: "AIzaSyCElg_et8_Z8ERTWo5tAwZJk2tb2ztUwlc",
    authDomain: "jlmp-diesel.firebaseapp.com",
    projectId: "jlmp-diesel",
    storageBucket: "jlmp-diesel.appspot.com", // Asegúrate que el bucket sea el correcto
    messagingSenderId: "763318949751",
    appId: "1:763318949751:web:e712d1008d34fbc98ab372"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// ===== INICIO DE CÓDIGO NUEVO (INICIALIZAR STORAGE) =====
const storage = getStorage(app);
// ===== FIN DE CÓDIGO NUEVO =====

const vistaLogin = document.getElementById('vista-login');
const vistaApp = document.getElementById('vista-app');
const btnLogout = document.getElementById('btn-logout');

let todosLosConsumos = [];
let listasAdmin = { choferes: [], placas: [], empresas: [], proveedores: [], proyectos: [] };
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
function abrirModal() { modal.style.display = 'block'; }
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); }

function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("main-tab-link");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

async function cargarDatosIniciales() {
    document.getElementById('loadingMessage').style.display = 'block';
    try {
        const [consumosRes, choferesRes, placasRes, empresasRes, proveedoresRes, proyectosRes] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

function actualizarTodaLaUI() {
    poblarFiltroDeMes();
    poblarFiltrosReportes();
    const consumosFiltrados = obtenerConsumosFiltrados();
    calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
    calcularYMostrarTotalesPorProveedor(consumosFiltrados);
    calcularYMostrarTotalesPorProyecto(consumosFiltrados);
    calcularYMostrarTotalesPorChofer(consumosFiltrados);
    calcularYMostrarTotales(consumosFiltrados);
    poblarSelectores();
    mostrarListasAdmin();
    mostrarHistorialAgrupado(consumosFiltrados);
}

function poblarSelectores() {
    const selectores = { choferes: document.getElementById('selectChofer'), placas: document.getElementById('selectVolqueta'), empresas: document.getElementById('selectEmpresa'), proveedores: document.getElementById('selectProveedor'), proyectos: document.getElementById('selectProyecto') };
    const titulos = { choferes: '--- Chofer ---', placas: '--- Placa ---', empresas: '--- Empresa ---', proveedores: '--- Proveedor ---', proyectos: '--- Proyecto ---' };
    for (const tipo in selectores) {
        const select = selectores[tipo];
        if (!select) continue;
        const valorActual = select.value;
        select.innerHTML = `<option value="" disabled selected>${titulos[tipo]}</option>`;
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}

function reiniciarFormulario() {
    document.getElementById('consumoForm').reset();
    document.getElementById('registroId').value = '';
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('formularioTitulo').textContent = 'Nuevo Registro';
    poblarSelectores();
}

// ===== INICIO DE FUNCIÓN MODIFICADA (LÓGICA DE SUBIDA DE ARCHIVOS) =====
async function guardarOActualizar(e) {
    e.preventDefault();
    const btnGuardar = document.getElementById('btnGuardar');
    btnGuardar.disabled = true; // Deshabilita el botón para evitar doble clic
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const id = document.getElementById('registroId').value;
    const archivo = document.getElementById('facturaArchivo').files[0];
    
    let datosConsumo = {
        volqueta: document.getElementById('selectVolqueta').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        numeroFactura: document.getElementById('numeroFactura').value,
        galones: document.getElementById('galones').value,
        costo: document.getElementById('costo').value,
        descripcion: document.getElementById('descripcion').value,
        chofer: document.getElementById('selectChofer').value,
        empresa: document.getElementById('selectEmpresa').value,
        proveedor: document.getElementById('selectProveedor').value,
        proyecto: document.getElementById('selectProyecto').value
    };

    if (!datosConsumo.chofer || !datosConsumo.volqueta || !datosConsumo.empresa || !datosConsumo.proveedor || !datosConsumo.proyecto) {
        mostrarNotificacion("Por favor, complete todos los campos obligatorios.", "error");
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
        return;
    }

    try {
        if (archivo) {
            mostrarNotificacion("Subiendo factura...", "info", 5000);
            const nombreArchivo = `${Date.now()}-${archivo.name}`;
            const storageRef = ref(storage, `facturas/${nombreArchivo}`);
            const snapshot = await uploadBytes(storageRef, archivo);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            datosConsumo.facturaURL = downloadURL;
            datosConsumo.facturaPath = snapshot.ref.fullPath; // Guardamos la ruta para poder borrarlo
        }

        if (id) {
            await updateDoc(doc(db, "consumos", id), datosConsumo);
            mostrarNotificacion("Registro actualizado con éxito", "exito");
        } else {
            await addDoc(collection(db, "consumos"), datosConsumo);
            mostrarNotificacion("Registro guardado con éxito", "exito");
        }
        
        reiniciarFormulario();
        cerrarModal();
        await cargarDatosIniciales();

    } catch (error) {
        console.error("Error guardando o subiendo archivo:", error);
        mostrarNotificacion("Error: No se pudo guardar el registro o subir la factura.", "error");
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

async function agregarItemAdmin(tipo, inputElement) {
    const valor = (tipo === 'placas') ? inputElement.value.trim().toUpperCase() : inputElement.value.trim();
    if (valor) {
        const listaNombres = listasAdmin[tipo].map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(valor.toUpperCase())) { mostrarNotificacion(`"${valor}" ya existe.`, "error"); return; }
        try {
            await addDoc(collection(db, tipo), { nombre: valor });
            mostrarNotificacion(`Elemento agregado correctamente.`, "exito");
            inputElement.value = '';
            await cargarDatosIniciales();
        } catch (error) {
            console.error("Error agregando:", error);
            mostrarNotificacion("No se pudo agregar el elemento.", "error");
        }
    }
}

function manejarAccionesHistorial(e) { const target = e.target.closest('button'); if (!target) return; const id = target.dataset.id; if (!id) return; if (target.classList.contains('btn-modificar')) cargarDatosParaModificar(id); if (target.classList.contains('btn-borrar')) borrarConsumoHistorial(id); }

function obtenerConsumosFiltrados() {
    const obtenerValorFiltro = (syncId) => document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`).value;
    const mes = obtenerValorFiltro('filtroMes');
    const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
    const fechaFin = obtenerValorFiltro('filtroFechaFin');
    const chofer = obtenerValorFiltro('filtroChofer');
    const proveedor = obtenerValorFiltro('filtroProveedor');
    const empresa = obtenerValorFiltro('filtroEmpresa');
    const proyecto = obtenerValorFiltro('filtroProyecto');
    let consumosFiltrados = todosLosConsumos;
    if (fechaInicio && fechaFin) { if (fechaFin < fechaInicio) { mostrarNotificacion("La fecha de fin no puede ser anterior a la de inicio.", "error"); return []; } consumosFiltrados = consumosFiltrados.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin); } else if (fechaInicio) { consumosFiltrados = consumosFiltrados.filter(c => c.fecha === fechaInicio); } else if (mes !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.fecha.startsWith(mes)); }
    if (chofer !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.chofer === chofer); }
    if (proveedor !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proveedor === proveedor); }
    if (empresa !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.empresa === empresa); }
    if (proyecto !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proyecto === proyecto); }
    return consumosFiltrados;
}

function mostrarListasAdmin() {
    const contenedores = { choferes: 'listaChoferes', placas: 'listaPlacas', empresas: 'listaEmpresas', proveedores: 'listaProveedores', proyectos: 'listaProyectos' };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul) continue;
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) { ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; continue; }
        listasAdmin[tipo].forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nombre}</span><div><button class="btn-accion btn-modificar button-warning" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button><button class="btn-accion btn-borrar" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button></div>`;
            li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
            li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}

async function modificarItemAdmin(item, tipo) { const valorActual = item.nombre; const nuevoValor = prompt(`Modificar "${valorActual}":`, valorActual); if (!nuevoValor || nuevoValor.trim() === '' || nuevoValor.trim() === valorActual) return; const valorFormateado = (tipo === 'placas') ? nuevoValor.trim().toUpperCase() : nuevoValor.trim(); const propiedad = { placas: 'volqueta', choferes: 'chofer', empresas: 'empresa', proveedores: 'proveedor', proyectos: 'proyecto' }[tipo]; if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"? Esto actualizará TODOS los registros.`)) { try { await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); const updates = todosLosConsumos.filter(consumo => consumo[propiedad] === valorActual).map(consumo => updateDoc(doc(db, "consumos", consumo.id), { [propiedad]: valorFormateado })); await Promise.all(updates); await cargarDatosIniciales(); mostrarNotificacion("Actualización masiva completada.", "exito"); } catch(e) { console.error("Error modificando:", e); mostrarNotificacion("Error al modificar.", "error"); } } }

function cargarDatosParaModificar(id) {
    const consumo = todosLosConsumos.find(c => c.id === id); if (!consumo) return;
    document.getElementById('registroId').value = consumo.id; document.getElementById('fecha').value = consumo.fecha; document.getElementById('hora').value = consumo.hora || ''; document.getElementById('numeroFactura').value = consumo.numeroFactura || ''; document.getElementById('selectChofer').value = consumo.chofer; document.getElementById('selectVolqueta').value = consumo.volqueta; document.getElementById('galones').value = consumo.galones; document.getElementById('costo').value = consumo.costo; document.getElementById('descripcion').value = consumo.descripcion; document.getElementById('selectEmpresa').value = consumo.empresa || ""; document.getElementById('selectProveedor').value = consumo.proveedor || ""; document.getElementById('selectProyecto').value = consumo.proyecto || "";
    // Nota: No se puede pre-cargar el campo de archivo por seguridad del navegador.
    abrirModal();
}

function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) {
    const resumenBody = document.getElementById(bodyId); const resumenFooter = document.getElementById(footerId);
    resumenBody.innerHTML = ''; resumenFooter.innerHTML = '';
    const totales = {};
    consumos.forEach(c => { const clave = c[categoria]; if (!clave) return; if (!totales[clave]) totales[clave] = { totalGalones: 0, totalCosto: 0 }; totales[clave].totalGalones += parseFloat(c.galones) || 0; totales[clave].totalCosto += parseFloat(c.costo) || 0; });
    if (Object.keys(totales).length === 0) { resumenBody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay datos.</td></tr>`; return; }
    const clavesOrdenadas = Object.keys(totales).sort();
    let htmlBody = '', granTotalGalones = 0, granTotalCosto = 0;
    clavesOrdenadas.forEach(clave => { const total = totales[clave]; htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td><td>$${total.totalCosto.toFixed(2)}</td></tr>`; granTotalGalones += total.totalGalones; granTotalCosto += total.totalCosto; });
    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td><td><strong>$${granTotalCosto.toFixed(2)}</strong></td></tr>`;
}

const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };

// ===== INICIO DE FUNCIÓN MODIFICADA (LÓGICA DE BORRADO DE ARCHIVOS) =====
async function borrarConsumoHistorial(id) {
    if (confirm('¿Seguro que quieres borrar este registro? Esta acción no se puede deshacer.')) {
        try {
            const consumo = todosLosConsumos.find(c => c.id === id);
            // Si el registro tiene una factura asociada, borrarla de Storage primero
            if (consumo && consumo.facturaPath) {
                mostrarNotificacion("Borrando factura adjunta...", "info");
                const facturaRef = ref(storage, consumo.facturaPath);
                await deleteObject(facturaRef);
            }
            // Luego, borrar el registro de Firestore
            await deleteDoc(doc(db, "consumos", id));
            mostrarNotificacion("Registro borrado con éxito.", "exito");
            await cargarDatosIniciales();
        } catch (error) {
            console.error("Error borrando registro o factura:", error);
            mostrarNotificacion("No se pudo borrar el registro o su factura.", "error");
        }
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function poblarFiltroDeMes() { const filtros = document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]'); const mesesUnicos = [...new Set(todosLosConsumos.map(c => c.fecha.substring(0, 7)))]; mesesUnicos.sort().reverse(); filtros.forEach(filtroSelect => { const valorSeleccionado = filtroSelect.value; filtroSelect.innerHTML = '<option value="todos">Todos los Meses</option>'; mesesUnicos.forEach(mes => { const [year, month] = mes.split('-'); const fechaMes = new Date(year, month - 1); const nombreMes = fechaMes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }); const opcion = document.createElement('option'); opcion.value = mes; opcion.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1); filtroSelect.appendChild(opcion); }); if (filtroSelect.value) filtroSelect.value = valorSeleccionado || 'todos'; }); }
function poblarFiltrosReportes() { const tipos = { choferes: 'filtroChofer', proveedores: 'filtroProveedor', empresas: 'filtroEmpresa', proyectos: 'filtroProyecto' }; const titulos = { choferes: 'Todos los Choferes', proveedores: 'Todos los Proveedores', empresas: 'Todas las Empresas', proyectos: 'Todos los Proyectos' }; for (const tipo in tipos) { const syncId = tipos[tipo]; const selects = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`); selects.forEach(select => { const valorActual = select.value; select.innerHTML = `<option value="todos">${titulos[tipo]}</option>`; listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; }); select.value = valorActual || 'todos'; }); } }

// ===== INICIO DE FUNCIÓN MODIFICADA (MUESTRA EL ENLACE A LA FACTURA) =====
function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody'); const historialFooter = document.getElementById('historialFooter');
    historialBody.innerHTML = ''; historialFooter.innerHTML = '';
    if (consumos.length === 0) { historialBody.innerHTML = `<tr><td colspan="13" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`; return; }
    let totalGalones = 0, totalCosto = 0;
    consumos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumos.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
        if (mesAnio !== mesAnioActual && !(obtenerConsumosFiltrados.fechaInicio && obtenerConsumosFiltrados.fechaFin)) {
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr'); filaGrupo.className = 'fila-grupo'; filaGrupo.innerHTML = `<td colspan="13">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        const linkFactura = consumo.facturaURL
            ? `<a href="${consumo.facturaURL}" target="_blank" title="Ver factura"><i class="fa-solid fa-file-invoice"></i></a>`
            : 'N/A';
        filaDato.innerHTML = `<td class="no-print"><button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button><button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button></td>
            <td>${linkFactura}</td><td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.numeroFactura || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td><td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    historialFooter.innerHTML = `<tr><td class="no-print" colspan="2"></td><td colspan="7" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

// ===== INICIO DE FUNCIÓN NUEVA (PREPARA FACTURAS PARA IMPRESIÓN) =====
function prepararFacturasParaImpresion() {
    const contenedor = document.getElementById('facturas-impresion');
    contenedor.innerHTML = ''; // Limpia el contenedor antes de llenarlo
    const consumosFiltrados = obtenerConsumosFiltrados();

    consumosFiltrados.forEach(consumo => {
        if (consumo.facturaURL) {
            const divFactura = document.createElement('div');
            divFactura.className = 'factura-impresa';

            const titulo = document.createElement('div');
            titulo.className = 'factura-titulo';
            titulo.textContent = `Factura del Registro: ${consumo.fecha} - ${consumo.volqueta}`;
            divFactura.appendChild(titulo);

            if (consumo.facturaURL.toLowerCase().includes('.pdf')) {
                const embed = document.createElement('embed');
                embed.src = consumo.facturaURL;
                embed.width = "100%";
                embed.height = "800px";
                divFactura.appendChild(embed);
            } else { // Asumimos que es una imagen
                const img = document.createElement('img');
                img.src = consumo.facturaURL;
                divFactura.appendChild(img);
            }
            contenedor.appendChild(divFactura);
        }
    });
}
// ===== FIN DE FUNCIÓN NUEVA =====

function asignarSincronizacionDeFiltros() {
    const filtros = document.querySelectorAll('.filtro-sincronizado');
    filtros.forEach(filtro => {
        filtro.addEventListener('change', (e) => {
            const syncId = e.target.dataset.syncId;
            const newValue = e.target.value;
            const filtrosASincronizar = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
            filtrosASincronizar.forEach(f => { if (f !== e.target) { f.value = newValue; } });
        });
    });
}

function handleLogin(e) { e.preventDefault(); const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; signInWithEmailAndPassword(auth, email, password).then(userCredential => { mostrarNotificacion("Bienvenido de nuevo", "exito"); }).catch(error => { mostrarNotificacion("Credenciales incorrectas.", "error"); }); }
function handleLogout() { signOut(auth).catch(error => { mostrarNotificacion("Error al cerrar sesión: " + error.message, "error"); }); }

function asignarEventosApp() {
    btnAbrirModal.addEventListener('click', abrirModal);
    btnCerrarModal.addEventListener('click', cerrarModal);
    
    document.getElementById('btnTabRegistrar').addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    document.getElementById('btnTabReportes').addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    document.getElementById('btnTabHistorial').addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    document.getElementById('btnTabAdmin').addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    document.getElementById('consumoForm').addEventListener('submit', guardarOActualizar);

    document.querySelectorAll('.btn-print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.printTarget;
            const targetTab = document.getElementById(targetId);
            
            if (targetTab) {
                // Si es la pestaña de historial, preparamos las facturas
                if (targetId === 'tabHistorial') {
                    prepararFacturasParaImpresion();
                }
                
                tabActivaParaImprimir = targetTab;
                targetTab.classList.add('printable-active');
                window.print();
            }
        });
    });
    
    window.onafterprint = () => {
        if (tabActivaParaImprimir) {
            tabActivaParaImprimir.classList.remove('printable-active');
            tabActivaParaImprimir = null;
        }
        // Limpia el contenedor de facturas después de imprimir
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
    
    document.getElementById('historialBody').addEventListener('click', manejarAccionesHistorial);
    document.getElementById('formAdminChofer').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    document.getElementById('formAdminPlaca').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    document.getElementById('formAdminEmpresa').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    document.getElementById('formAdminProveedor').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    document.getElementById('formAdminProyecto').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
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

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}

document.getElementById('login-form').addEventListener('submit', handleLogin);
btnLogout.addEventListener('click', handleLogout);