// =============================================================
//  herr-extra.js — Diccionario SMX (con inglés técnico)
//  y checklists de prácticas
// =============================================================
import { esc, normalizar } from "./comun.js";
import { icono } from "./iconos.js";
import { GUIAS } from "./herr-guias.js";

// ---------- Inglés técnico: [inglés, castellano, nota] ----------
export const INGLES = [
  ["Hardware", "Parte física del ordenador", "Lo que se puede tocar"], ["Software", "Programas", ""], ["Motherboard", "Placa base", ""],
  ["Power supply (PSU)", "Fuente de alimentación", ""], ["Hard drive (HDD)", "Disco duro", ""], ["Solid-state drive (SSD)", "Disco sólido", ""],
  ["Memory (RAM)", "Memoria RAM", ""], ["Graphics card (GPU)", "Tarjeta gráfica", ""], ["Fan / Heatsink", "Ventilador / Disipador", ""],
  ["Thermal paste", "Pasta térmica", "Entre la CPU y el disipador"], ["Case", "Caja / torre", ""], ["Slot", "Ranura", "Donde se pincha una tarjeta o la RAM"],
  ["Port", "Puerto", "Físico (USB) o lógico (80, 443…)"], ["Plug", "Enchufe / conector", ""], ["Wire / Cable", "Cable", ""],
  ["Network", "Red", ""], ["Network interface card (NIC)", "Tarjeta de red", ""], ["Switch", "Conmutador", "Une equipos de la misma red"],
  ["Router", "Encaminador", "Une redes distintas"], ["Access point (AP)", "Punto de acceso wifi", ""], ["Gateway", "Puerta de enlace", "El router que te saca de tu red"],
  ["Subnet mask", "Máscara de subred", ""], ["Broadcast", "Difusión", "Mensaje a todos los equipos"], ["Bandwidth", "Ancho de banda", ""],
  ["Throughput", "Rendimiento real de la red", ""], ["Latency", "Latencia", "Retraso de la red (ms)"], ["Packet loss", "Pérdida de paquetes", ""],
  ["Firewall", "Cortafuegos", ""], ["Proxy", "Intermediario", "Equipo que navega por ti"], ["VPN", "Red privada virtual", "Túnel cifrado"],
  ["Wireless", "Inalámbrico", ""], ["Wired", "Por cable", ""], ["Twisted pair", "Par trenzado", ""], ["Patch panel", "Panel de parcheo", ""],
  ["Rack", "Armario de red", ""], ["Crimping tool", "Crimpadora", ""], ["Cable tester", "Comprobador de cables", ""],
  ["Server", "Servidor", ""], ["Client", "Cliente", ""], ["Host", "Equipo / anfitrión", ""], ["Domain", "Dominio", ""],
  ["Domain controller", "Controlador de dominio", "Servidor con Active Directory"], ["Organizational unit (OU)", "Unidad organizativa", ""],
  ["Group Policy (GPO)", "Directiva de grupo", ""], ["Share / Shared folder", "Recurso / carpeta compartida", ""], ["Permissions", "Permisos", ""],
  ["User account", "Cuenta de usuario", ""], ["Password", "Contraseña", ""], ["Username", "Nombre de usuario", ""], ["Log in / Sign in", "Iniciar sesión", ""],
  ["Log out / Sign out", "Cerrar sesión", ""], ["Settings", "Configuración / ajustes", ""], ["Control Panel", "Panel de control", ""],
  ["Device Manager", "Administrador de dispositivos", ""], ["Task Manager", "Administrador de tareas", ""], ["Event Viewer", "Visor de eventos", ""],
  ["Driver", "Controlador", "Programa para que funcione un dispositivo"], ["Update", "Actualización", ""], ["Upgrade", "Mejora / actualización de versión", ""],
  ["Install / Uninstall", "Instalar / desinstalar", ""], ["Boot", "Arranque", ""], ["Reboot / Restart", "Reiniciar", ""], ["Shutdown", "Apagar", ""],
  ["BIOS / UEFI", "Firmware de arranque", "Lo primero que se ejecuta al encender"], ["Partition", "Partición", ""], ["Format", "Formatear", ""],
  ["File system", "Sistema de archivos", "NTFS, FAT32, ext4…"], ["Backup", "Copia de seguridad", ""], ["Restore", "Restaurar", ""],
  ["Snapshot", "Instantánea", ""], ["Virtual machine (VM)", "Máquina virtual", ""], ["Hypervisor", "Hipervisor", "VirtualBox, VMware, Hyper-V"],
  ["Guest / Host", "Invitado / anfitrión", "La VM / tu PC real"], ["Cloud", "Nube", ""], ["Storage", "Almacenamiento", ""],
  ["Folder / Directory", "Carpeta / directorio", ""], ["File", "Archivo", ""], ["Path", "Ruta", ""], ["Command line (CLI)", "Línea de comandos", ""],
  ["Shell / Terminal", "Intérprete de comandos / terminal", ""], ["Script", "Guion / programa corto", ""], ["Output / Input", "Salida / entrada", ""],
  ["Troubleshooting", "Resolución de problemas", ""], ["Issue / Bug", "Problema / error del programa", ""], ["Warning", "Advertencia", ""],
  ["Error", "Error", ""], ["Timeout", "Tiempo de espera agotado", ""], ["Unreachable", "Inalcanzable", "«Destination host unreachable» en ping"],
  ["Enable / Disable", "Activar / desactivar", ""], ["Default", "Por defecto / predeterminado", ""], ["Encryption", "Cifrado", ""],
  ["Malware", "Software malicioso", ""], ["Phishing", "Suplantación para robar datos", ""], ["Ransomware", "Secuestro de datos", ""],
  ["Two-factor authentication (2FA)", "Verificación en dos pasos", ""], ["Plug and play", "Conectar y usar", ""], ["Uptime / Downtime", "Tiempo en marcha / caído", ""],
  ["Help desk", "Soporte técnico", ""], ["Ticket", "Incidencia", "Aviso de un problema en soporte"], ["Deploy", "Desplegar / instalar en producción", ""],
];

// ---------- Diccionario ----------
function htmlDiccionario(e) {
  const t = e.herr || {};
  const modo = t.dicModo || "todo";
  const q = normalizar(t.dicQ || "");
  let filas = [];
  if (modo === "ingles") filas = INGLES.map(([en, es, nota]) => ({ termino: en, def: es + (nota ? ` — ${nota}` : ""), de: "Inglés técnico" }));
  else {
    for (const [id, g] of Object.entries(GUIAS)) for (const [p, d] of g.palabras || []) filas.push({ termino: p, def: d, de: id });
    filas.push(...INGLES.map(([en, es, nota]) => ({ termino: en, def: es + (nota ? ` — ${nota}` : ""), de: "Inglés técnico" })));
  }
  if (q) filas = filas.filter((f) => normalizar(`${f.termino} ${f.def}`).includes(q));
  filas.sort((a, b) => a.termino.localeCompare(b.termino, "es"));
  const nombreDe = (de) => de === "Inglés técnico" ? de : (de.charAt(0).toUpperCase() + de.slice(1));
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("materias")} Diccionario SMX</h2><span class="texto-suave">${filas.length} términos</span></div>
    <div class="filtros"><label class="buscador">${icono("buscar")}<input type="search" id="dicQ" data-herr="dicQ" value="${esc(t.dicQ || "")}" placeholder="Busca: broadcast, switch, gateway…" aria-label="Buscar en el diccionario"></label>
      <div class="segmentos">${[["todo", "Todo"], ["ingles", "Inglés técnico"]].map(([v, l]) => `<button type="button" class="segmento" aria-pressed="${modo === v}" data-accion="herr-dic-modo" data-v="${v}">${l}</button>`).join("")}</div></div>
    ${filas.length ? `<dl class="dic">${filas.slice(0, 300).map((f) => `<div><dt>${esc(f.termino)}</dt><dd>${esc(f.def)}</dd>${f.de !== "Inglés técnico" ? `<a class="dic-de" href="#herramientas/${esc(f.de)}">${esc(nombreDe(f.de))}</a>` : `<span class="dic-de">EN</span>`}</div>`).join("")}</dl>`
      : `<p class="texto-suave">No hay nada con esa palabra.</p>`}
  </section>`;
}


// ---------- Checklists de prácticas ----------
export const CHECKLISTS = {
  cable: { t: "Crimpar un cable de red", pasos: ["Corta el cable a la medida (máx. 100 m)", "Pela unos 3 cm de funda sin cortar los hilos", "Destrenza y ordena los hilos según T568B", "Alinea y corta los hilos rectos a ~1,3 cm", "Mete los hilos hasta el fondo del RJ45 (la funda dentro)", "Crimpa con fuerza", "Repite en la otra punta con el mismo orden", "Comprueba con el tester: 1-1, 2-2 … 8-8"] },
  pc: { t: "Montar un PC", pasos: ["Ponte la pulsera antiestática", "Monta la CPU en la placa (fíjate en el triángulo)", "Pon pasta térmica y el disipador; conecta su ventilador", "Inserta la RAM (en las ranuras que diga el manual)", "Instala el SSD M.2 o SATA", "Coloca las piezas en la caja (separadores de la placa)", "Instala la fuente y conecta 24 pines, 8 pines CPU y SATA", "Conecta el panel frontal (power, reset, USB)", "Conecta la gráfica si hay y cierra con bridas", "Primer arranque: entra en la BIOS/UEFI y comprueba RAM y disco"] },
  vbox: { t: "Instalar Ubuntu en VirtualBox", pasos: ["Descarga la ISO de Ubuntu y comprueba su SHA-256", "Nueva máquina: nombre, tipo Linux, Ubuntu 64 bits", "RAM 4 GB, 2 CPU, disco 25 GB dinámico", "Red: adaptador puente (o NAT)", "Monta la ISO en el lector óptico", "Instala Ubuntu (usuario y contraseña)", "Quita la ISO y reinicia", "Instala las Guest Additions", "Haz una instantánea «Recién instalado»"] },
  dominio: { t: "Windows Server + dominio", pasos: ["IP fija en el servidor (y DNS apuntando a sí mismo)", "Cambia el nombre del servidor y reinicia", "Añade el rol Servicios de dominio de Active Directory", "Promociona a controlador de dominio (bosque nuevo smx.local)", "Crea las unidades organizativas (OU)", "Crea usuarios y grupos", "En el cliente: DNS = IP del servidor", "Une el cliente al dominio y reinicia", "Inicia sesión con un usuario del dominio", "Aplica una GPO de prueba y comprueba con gpresult /r"] },
  dhcp: { t: "Configurar DHCP (Windows Server)", pasos: ["IP fija en el servidor", "Añade el rol Servidor DHCP", "Autoriza el servidor DHCP en el dominio", "Crea un ámbito (rango de IPs y máscara)", "Añade exclusiones (IPs fijas: router, servidor, impresora)", "Opciones: puerta de enlace (003) y DNS (006)", "Activa el ámbito", "En el cliente: ipconfig /release y /renew", "Comprueba la concesión en la consola DHCP"] },
  cisco: { t: "Configuración básica de router Cisco", pasos: ["Conecta el cable de consola y abre Terminal", "enable → configure terminal", "hostname R1", "enable secret, contraseña de consola y service password-encryption", "Configura las interfaces (ip address + no shutdown)", "Ruta por defecto o enrutamiento", "Comprueba con show ip interface brief", "Prueba ping desde los PCs", "Guarda: copy running-config startup-config"] },
};
function htmlChecklists(e) {
  const t = (e.herr ||= {});
  const chk = (t.chk ||= {});
  const sel = CHECKLISTS[t.chkSel] ? t.chkSel : "cable";
  const c = CHECKLISTS[sel];
  const marcados = chk[sel] || [];
  const hechos = c.pasos.filter((_, i) => marcados[i]).length;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Checklists de prácticas</h2></div>
    <div class="filtros">${Object.entries(CHECKLISTS).map(([k, x]) => { const m = chk[k] || []; const h = x.pasos.filter((_, i) => m[i]).length;
      return `<button type="button" class="chip" aria-pressed="${sel === k}" data-accion="herr-chk-sel" data-k="${k}">${esc(x.t)}${h ? ` · ${h}/${x.pasos.length}` : ""}</button>`; }).join("")}</div>
    <h3 class="bib-seccion">${esc(c.t)} <small class="texto-suave">${hechos}/${c.pasos.length}</small></h3>
    <div class="progreso"><i style="width:${(hechos / c.pasos.length) * 100}%"></i></div>
    <ol class="checklist chk-pasos">${c.pasos.map((p, i) => `<li><label><input type="checkbox" data-herr="chk.${sel}.${i}" ${marcados[i] ? "checked" : ""}> <span>${esc(p)}</span></label></li>`).join("")}</ol>
    <div class="fila-botones"><button type="button" class="boton" data-accion="herr-chk-reset" data-k="${sel}">Desmarcar todo</button></div>
    <p class="nota-pie">Se guarda en este dispositivo. Con «Guardar en una materia» te llevas la lista marcada a tus apuntes.</p>
  </section>`;
}

export const HERRAMIENTAS = [
  { id: "diccionario", t: "Diccionario SMX", grupo: "Referencia", desc: "Todas las definiciones y el inglés técnico", html: htmlDiccionario },
  { id: "checklists", t: "Checklists de prácticas", grupo: "Hardware", desc: "Paso a paso: cable, PC, dominio, DHCP…", html: htmlChecklists },
];

export const acciones = {
  "herr-dic-modo"(b, api) { api.estado().herr.dicModo = b.dataset.v; api.pintar(); },
  "herr-chk-sel"(b, api) { api.estado().herr.chkSel = b.dataset.k; api.pintar(); },
  "herr-chk-reset"(b, api) { const t = api.estado().herr; (t.chk ||= {})[b.dataset.k] = []; api.pintar(); },
};
export const formularios = {};
// Casillas de las checklists: "chk.cable.3"
export function alEscribir(t, k, v) {
  const m = k.match(/^chk\.(\w+)\.(\d+)$/);
  if (!m) return false;
  ((t.chk ||= {})[m[1]] ||= [])[Number(m[2])] = Boolean(v);
  return true;
}
