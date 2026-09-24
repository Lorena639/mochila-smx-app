// =============================================================
//  herr-extra.js — Diccionario SMX (con inglés técnico),
//  simulador de terminal Linux y checklists de prácticas
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

// ---------- Terminal Linux (simulada) ----------
const INICIO_FS = () => ({
  "/": { t: "d" }, "/home": { t: "d" }, "/home/lorena": { t: "d" }, "/home/lorena/Documentos": { t: "d" },
  "/home/lorena/Documentos/leeme.txt": { t: "f", c: "Bienvenida a la terminal de práctica.\nEscribe «help» para ver los comandos.", p: "644" },
  "/etc": { t: "d" }, "/etc/hostname": { t: "f", c: "pc-lorena", p: "644" }, "/tmp": { t: "d" },
});
const RETOS = [
  ["Entra en tu carpeta Documentos", (s) => s.cwd === "/home/lorena/Documentos"],
  ["Crea una carpeta llamada practicas dentro de tu carpeta personal", (s) => s.fs["/home/lorena/practicas"]?.t === "d"],
  ["Crea el archivo notas.txt dentro de practicas con el texto «hola» (echo hola > …)", (s) => s.fs["/home/lorena/practicas/notas.txt"]?.c?.trim() === "hola"],
  ["Dale permisos 600 a notas.txt", (s) => s.fs["/home/lorena/practicas/notas.txt"]?.p === "600"],
  ["Copia leeme.txt a la carpeta practicas", (s) => Boolean(s.fs["/home/lorena/practicas/leeme.txt"])],
  ["Borra la carpeta /tmp/basura (créala antes con mkdir)", (s) => s.creoBasura && !s.fs["/tmp/basura"]],
];
const AYUDA = {
  pwd: "Muestra en qué carpeta estás", ls: "Lista archivos (ls -l para ver permisos)", cd: "Cambia de carpeta (cd .. sube, cd ~ vuelve a casa)",
  mkdir: "Crea una carpeta (mkdir -p a/b crea también las de en medio)", touch: "Crea un archivo vacío", echo: "Escribe texto (echo hola > archivo lo guarda)",
  cat: "Muestra un archivo", cp: "Copia (cp origen destino)", mv: "Mueve o cambia el nombre", rm: "Borra (rm -r para carpetas)",
  chmod: "Cambia permisos (chmod 755 archivo)", whoami: "Tu usuario", hostname: "Nombre del equipo", date: "Fecha y hora", clear: "Limpia la pantalla",
  "ip a": "Tus direcciones IP", ping: "Comprueba si un equipo responde", history: "Comandos que has escrito", help: "Esta ayuda", reset: "Vuelve a empezar desde cero",
};
function estadoTerm(t) {
  if (!t.term?.fs) t.term = { fs: INICIO_FS(), cwd: "/home/lorena", lineas: ["Terminal de práctica (simulada). Nada de lo que hagas aquí afecta a tu ordenador. Escribe «help»."], hist: [] };
  return t.term;
}
function ruta(s, p) {
  if (!p || p === "~") return "/home/lorena";
  let base = p.startsWith("/") ? [] : s.cwd.split("/").filter(Boolean);
  if (p.startsWith("~/")) { base = ["home", "lorena"]; p = p.slice(2); }
  for (const parte of p.split("/").filter(Boolean)) {
    if (parte === ".") continue;
    if (parte === "..") base.pop(); else base.push(parte);
  }
  return "/" + base.join("/");
}
const padre = (p) => p.slice(0, p.lastIndexOf("/")) || "/";
const hijos = (s, dir) => Object.keys(s.fs).filter((k) => k !== dir && padre(k) === dir).sort();
const perm = (o) => [...o].map((d) => { const n = +d; return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-"); }).join("");
export function ejecutarTerm(s, linea) {
  const out = [];
  const err = (m) => out.push(m);
  const redir = linea.match(/^(.*?)\s*(>>?)\s*(\S+)\s*$/);
  let cmd = linea, destino = null, anadir = false;
  if (redir && /^echo\b/.test(redir[1].trim())) { cmd = redir[1]; destino = redir[3]; anadir = redir[2] === ">>"; }
  const partes = cmd.trim().match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const args = partes.slice(1).map((a) => a.replace(/^["']|["']$/g, ""));
  const flags = args.filter((a) => a.startsWith("-")).join("");
  const nom = args.filter((a) => !a.startsWith("-"));
  switch (partes[0]) {
    case undefined: break;
    case "help": out.push(...Object.entries(AYUDA).map(([k, v]) => `${k.padEnd(9)} ${v}`)); break;
    case "pwd": out.push(s.cwd); break;
    case "whoami": out.push("lorena"); break;
    case "hostname": out.push(s.fs["/etc/hostname"]?.c || "pc-lorena"); break;
    case "date": out.push(new Date().toString()); break;
    case "clear": s.lineas = []; return [];
    case "reset": Object.assign(s, { fs: INICIO_FS(), cwd: "/home/lorena", lineas: [], hist: [], creoBasura: false }); return ["Terminal reiniciada."];
    case "history": out.push(...s.hist.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`)); break;
    case "ls": {
      const dir = ruta(s, nom[0] || ".");
      if (!s.fs[dir]) { err(`ls: no se puede acceder a '${nom[0]}': No existe el archivo o el directorio`); break; }
      if (s.fs[dir].t === "f") { out.push(nom[0]); break; }
      const hs = hijos(s, dir);
      if (flags.includes("l")) out.push(`total ${hs.length}`, ...hs.map((k) => { const x = s.fs[k]; return `${x.t === "d" ? "d" : "-"}${perm(x.p || "755")} 1 lorena lorena ${String(x.c?.length || 4096).padStart(5)} ${k.split("/").pop()}`; }));
      else out.push(hs.map((k) => k.split("/").pop() + (s.fs[k].t === "d" ? "/" : "")).join("  ") || "");
      break;
    }
    case "cd": {
      const dir = ruta(s, nom[0] || "~");
      if (!s.fs[dir]) err(`cd: ${nom[0]}: No existe el archivo o el directorio`);
      else if (s.fs[dir].t !== "d") err(`cd: ${nom[0]}: No es un directorio`);
      else s.cwd = dir;
      break;
    }
    case "mkdir": {
      if (!nom.length) { err("mkdir: falta un operando"); break; }
      for (const n of nom) {
        const p = ruta(s, n);
        if (s.fs[p]) { err(`mkdir: no se puede crear el directorio «${n}»: El archivo ya existe`); continue; }
        if (!s.fs[padre(p)] && !flags.includes("p")) { err(`mkdir: no se puede crear el directorio «${n}»: No existe el archivo o el directorio (usa -p)`); continue; }
        let acc = "";
        for (const trozo of p.split("/").filter(Boolean)) { acc += "/" + trozo; s.fs[acc] ||= { t: "d", p: "755" }; }
        if (p === "/tmp/basura") s.creoBasura = true;
      }
      break;
    }
    case "touch": for (const n of nom) { const p = ruta(s, n); if (!s.fs[padre(p)]) err(`touch: no se puede tocar '${n}': No existe el directorio`); else s.fs[p] ||= { t: "f", c: "", p: "644" }; } break;
    case "echo": {
      const texto = args.join(" ");
      if (!destino) { out.push(texto); break; }
      const p = ruta(s, destino);
      if (!s.fs[padre(p)]) { err(`bash: ${destino}: No existe el archivo o el directorio`); break; }
      const prev = anadir && s.fs[p]?.c ? s.fs[p].c + "\n" : "";
      s.fs[p] = { t: "f", c: prev + texto, p: s.fs[p]?.p || "644" };
      break;
    }
    case "cat": for (const n of nom) { const x = s.fs[ruta(s, n)]; if (!x) err(`cat: ${n}: No existe el archivo o el directorio`); else if (x.t === "d") err(`cat: ${n}: Es un directorio`); else out.push(...x.c.split("\n")); } break;
    case "rm": for (const n of nom) {
      const p = ruta(s, n);
      if (!s.fs[p]) { err(`rm: no se puede borrar '${n}': No existe el archivo o el directorio`); continue; }
      if (s.fs[p].t === "d" && !flags.includes("r")) { err(`rm: no se puede borrar '${n}': Es un directorio (usa rm -r)`); continue; }
      if (p === "/" || p === "/home" || p === "/home/lorena") { err("rm: mejor no borres eso (en un Linux real te quedarías sin sistema)"); continue; }
      for (const k of Object.keys(s.fs)) if (k === p || k.startsWith(p + "/")) delete s.fs[k];
    } break;
    case "cp": case "mv": {
      if (nom.length < 2) { err(`${partes[0]}: falta el archivo de destino`); break; }
      const o = ruta(s, nom[0]); let d = ruta(s, nom[1]);
      if (!s.fs[o]) { err(`${partes[0]}: no se puede efectuar 'stat' sobre '${nom[0]}': No existe el archivo o el directorio`); break; }
      if (s.fs[d]?.t === "d") d = `${d === "/" ? "" : d}/${o.split("/").pop()}`;
      if (s.fs[o].t === "d" && partes[0] === "cp" && !flags.includes("r")) { err(`cp: se omite el directorio '${nom[0]}' (usa cp -r)`); break; }
      for (const k of Object.keys(s.fs)) if (k === o || k.startsWith(o + "/")) {
        s.fs[d + k.slice(o.length)] = { ...s.fs[k] };
        if (partes[0] === "mv") delete s.fs[k];
      }
      break;
    }
    case "chmod": {
      const [modo, n] = nom;
      const p = ruta(s, n || "");
      if (!/^[0-7]{3}$/.test(modo || "")) { err("chmod: usa un número de 3 cifras, por ejemplo chmod 644 archivo"); break; }
      if (!s.fs[p]) { err(`chmod: no se puede acceder a '${n}': No existe el archivo o el directorio`); break; }
      s.fs[p].p = modo;
      break;
    }
    case "ip": if (args[0] === "a" || args[0] === "addr") out.push("1: lo: <LOOPBACK,UP>", "    inet 127.0.0.1/8 scope host lo", "2: enp0s3: <BROADCAST,MULTICAST,UP>", "    link/ether 08:00:27:3a:1c:5e", "    inet 192.168.1.37/24 brd 192.168.1.255 scope global enp0s3"); else err("Prueba: ip a"); break;
    case "ping": {
      const h = nom[0];
      if (!h) { err("ping: falta el destino"); break; }
      out.push(`PING ${h} 56(84) bytes of data.`);
      for (let i = 1; i <= 4; i++) out.push(`64 bytes from ${h}: icmp_seq=${i} ttl=117 time=${(10 + Math.random() * 8).toFixed(1)} ms`);
      out.push(`--- ${h} ping statistics ---`, "4 packets transmitted, 4 received, 0% packet loss");
      break;
    }
    case "sudo": out.push("[sudo] contraseña para lorena: ", "(En esta terminal de práctica no hace falta sudo.)"); break;
    case "man": out.push(AYUDA[nom[0]] ? `${nom[0]}: ${AYUDA[nom[0]]}` : "No hay manual para eso aquí. Escribe «help»."); break;
    default: err(`${partes[0]}: orden no encontrada. Escribe «help» para ver lo que se puede probar.`);
  }
  return out;
}
function htmlTerminal(e) {
  const t = (e.herr ||= {});
  const s = estadoTerm(t);
  const hechos = RETOS.filter(([, ok]) => ok(s)).length;
  const prompt = `lorena@pc-lorena:${s.cwd.replace("/home/lorena", "~")}$`;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("terminal")} Terminal Linux de práctica</h2>
      <button type="button" class="enlace-ver" data-accion="herr-term-reset">Empezar de cero</button></div>
    <div class="terminal" id="terminal">
      <pre>${s.lineas.map(esc).join("\n")}</pre>
      <form data-form="herr-term" class="term-linea" autocomplete="off"><span class="mono">${esc(prompt)}</span>
        <input id="termIn" name="cmd" class="mono" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando" autofocus></form>
    </div>
    <p class="texto-suave">Es una simulación: puedes equivocarte sin miedo. Prueba: <code>ls -l</code>, <code>cd Documentos</code>, <code>cat leeme.txt</code>, <code>mkdir practicas</code>…</p>
  </section>
  <section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Retos</h2><span class="chip ${hechos === RETOS.length ? "ok" : ""}">${hechos}/${RETOS.length}</span></div>
    <ul class="checklist">${RETOS.map(([txt, ok]) => `<li><label><input type="checkbox" disabled ${ok(s) ? "checked" : ""}> <span>${esc(txt)}</span></label></li>`).join("")}</ul>
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
  { id: "terminal", t: "Terminal Linux", grupo: "Sistemas", desc: "Practica comandos sin miedo a romper nada", html: htmlTerminal },
  { id: "checklists", t: "Checklists de prácticas", grupo: "Hardware", desc: "Paso a paso: cable, PC, dominio, DHCP…", html: htmlChecklists },
];

export const acciones = {
  "herr-dic-modo"(b, api) { api.estado().herr.dicModo = b.dataset.v; api.pintar(); },
  "herr-term-reset"(b, api) { const t = api.estado().herr; delete t.term; api.pintar(); },
  "herr-chk-sel"(b, api) { api.estado().herr.chkSel = b.dataset.k; api.pintar(); },
  "herr-chk-reset"(b, api) { const t = api.estado().herr; (t.chk ||= {})[b.dataset.k] = []; api.pintar(); },
};
export const formularios = {
  "herr-term"(form, api) {
    const t = api.estado().herr;
    const s = estadoTerm(t);
    const linea = String(new FormData(form).get("cmd") || "");
    const prompt = `lorena@pc-lorena:${s.cwd.replace("/home/lorena", "~")}$ ${linea}`;
    if (linea.trim()) s.hist.push(linea);
    const out = ejecutarTerm(s, linea);
    if (linea.trim() !== "clear") s.lineas.push(prompt, ...out);
    s.lineas = s.lineas.slice(-200);
    api.pintar();
    setTimeout(() => { const el = document.getElementById("termIn"); el?.focus(); const tt = document.getElementById("terminal"); if (tt) tt.scrollTop = tt.scrollHeight; }, 0);
  },
};
// Casillas de las checklists: "chk.cable.3"
export function alEscribir(t, k, v) {
  const m = k.match(/^chk\.(\w+)\.(\d+)$/);
  if (!m) return false;
  ((t.chk ||= {})[m[1]] ||= [])[Number(m[2])] = Boolean(v);
  return true;
}
