// =============================================================
//  sb-windows.js — Consola de Windows (PowerShell y CMD)
//  Windows no puede ejecutarse en el navegador: esto es una
//  simulación, pero con las mismas órdenes, salidas y errores
//  que verías en un Windows 11 en castellano.
// =============================================================
import { crearTerminal, EditorLinea, TEMAS } from "./sb-terminal.js";

const CASA = "/Users/lorena";
const CLAVE = "mochila-sb-windows";
const INICIO_FS = () => {
  const m = Date.now();
  const d = (x = {}) => ({ t: "d", m, ...x }), f = (c) => ({ t: "f", c, m });
  return {
    "/": d(), "/Users": d(), [CASA]: d(), [CASA + "/Documentos"]: d(), [CASA + "/Descargas"]: d(), [CASA + "/Escritorio"]: d(),
    [CASA + "/Imágenes"]: d(), [CASA + "/Documentos/leeme.txt"]: f("Bienvenida a la consola de Windows.\r\nEscribe help para ver las órdenes."),
    [CASA + "/Documentos/alumnos.txt"]: f("Pepe\r\nAna\r\nLorena\r\nMarc"),
    "/Windows": d(), "/Windows/System32": d(), "/Windows/System32/drivers": d(), "/Windows/System32/drivers/etc": d(),
    "/Windows/System32/drivers/etc/hosts": f("# Archivo hosts de Windows\r\n127.0.0.1       localhost"),
    "/Program Files": d(), "/Program Files/Mozilla Firefox": d(), "/Temp": d(),
  };
};
const padre = (p) => p.slice(0, p.lastIndexOf("/")) || "/";
const nombreDe = (p) => p.split("/").pop();
export const aWin = (p) => "C:" + (p === "/" ? "\\" : p.replace(/\//g, "\\"));
const fechaCorta = (m) => { const x = new Date(m); return `${x.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}  ${x.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`; };
const fechaPs = (m) => { const x = new Date(m); return `${x.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })}${x.toLocaleTimeString("es-ES", { hour: "numeric", minute: "2-digit" }).padStart(8)}`; };
const miles = (n) => n.toLocaleString("es-ES");

// Nombre largo de cada alias (para los errores de PowerShell)
const CMDLET = {
  dir: "Get-ChildItem", ls: "Get-ChildItem", gci: "Get-ChildItem", cd: "Set-Location", sl: "Set-Location", chdir: "Set-Location",
  type: "Get-Content", cat: "Get-Content", gc: "Get-Content", del: "Remove-Item", rm: "Remove-Item", ri: "Remove-Item", rmdir: "Remove-Item", rd: "Remove-Item", erase: "Remove-Item",
  copy: "Copy-Item", cp: "Copy-Item", cpi: "Copy-Item", move: "Move-Item", mv: "Move-Item", mi: "Move-Item", ren: "Rename-Item", rni: "Rename-Item", ni: "New-Item", mkdir: "New-Item", md: "New-Item",
};
const AYUDA = [
  ["dir · ls · Get-ChildItem", "Lista archivos y carpetas"], ["cd · Set-Location", "Cambia de carpeta (cd .. sube, cd \\ va a C:\\)"],
  ["pwd · Get-Location", "Dice en qué carpeta estás"], ["mkdir · md", "Crea una carpeta"], ["New-Item -ItemType Directory x", "Crea una carpeta (PowerShell)"],
  ["New-Item x.txt", "Crea un archivo vacío"], ["echo hola > x.txt", "Guarda texto en un archivo (>> añade)"], ["Set-Content x.txt \"texto\"", "Escribe en un archivo (PowerShell)"],
  ["type · cat · Get-Content", "Muestra un archivo"], ["copy · Copy-Item", "Copia"], ["move · Move-Item", "Mueve"], ["ren · Rename-Item", "Cambia el nombre"],
  ["del · Remove-Item", "Borra archivos"], ["rmdir /s · Remove-Item -Recurse", "Borra carpetas con todo"], ["tree /f", "Árbol de carpetas"],
  ["ipconfig [/all] [/release] [/renew] [/flushdns]", "Configuración de red"], ["ping · tracert · nslookup", "Pruebas de red"], ["netstat -an", "Conexiones abiertas"],
  ["whoami · hostname · systeminfo", "Usuario, equipo y sistema"], ["tasklist · Get-Process", "Programas en marcha"], ["Get-Service", "Servicios"],
  ["$x = \"hola\" · Write-Host $x", "Variables de PowerShell"], ["orden | findstr texto", "Filtra la salida (también Select-String, sort, more)"],
  ["cmd · powershell · exit", "Cambia entre CMD y PowerShell"], ["cls · Clear-Host", "Limpia la pantalla"], ["history", "Órdenes que has escrito"], ["reset", "Vuelve a empezar desde cero"],
];

function nuevoEstado() { return { fs: INICIO_FS(), cwd: CASA, modo: "ps", vars: { nombre: "Lorena" }, retos: {} }; }
function cargar() {
  try { const g = JSON.parse(localStorage.getItem(CLAVE) || "null"); if (g?.fs) return { ...nuevoEstado(), ...g }; } catch { /* nada */ }
  return nuevoEstado();
}

export const windows = {
  s: null, t: null, ed: null,
  iniciar() {
    if (this.t) return;
    this.s = cargar();
    this.t = crearTerminal(this.s.modo === "cmd" ? "cmd" : "powershell");
    const term = this.t.term;
    this.ed = new EditorLinea(term, {
      prompt: () => this.prompt(),
      alEnter: (l) => this.ejecutar(l),
      completar: (antes) => this.completar(antes),
    });
    this.cabecera();
    this.ed.escribirPrompt();
    term.onData((d) => this.ed.datos(d));
  },
  prompt() { return this.s.modo === "cmd" ? `${aWin(this.s.cwd)}>` : `PS ${aWin(this.s.cwd)}> `; },
  cabecera() {
    const term = this.t.term;
    if (this.s.modo === "cmd") term.write("Microsoft Windows [Versión 10.0.22631.4169]\r\n(c) Microsoft Corporation. Todos los derechos reservados.\r\n\r\n");
    else term.write("Windows PowerShell\r\nCopyright (C) Microsoft Corporation. Todos los derechos reservados.\r\n\r\nInstale la versión más reciente de PowerShell para obtener nuevas características y mejoras. https://aka.ms/PSWindows\r\n\r\n");
  },
  guardar() { try { localStorage.setItem(CLAVE, JSON.stringify({ fs: this.s.fs, cwd: this.s.cwd, modo: this.s.modo, vars: this.s.vars, retos: this.s.retos })); } catch { /* lleno */ } },
  reiniciar() { this.s = nuevoEstado(); this.guardar(); if (this.t) { this.t.term.options.theme = TEMAS.powershell; this.t.term.reset(); this.cabecera(); this.ed.escribirPrompt(); } },
  enviar(d) { this.ed?.datos(d); },

  ruta(p) {
    p = String(p ?? "").replace(/^["']|["']$/g, "").replace(/\\/g, "/");
    if (!p || p === "~") return CASA;
    if (/^[a-z]:/i.test(p)) p = p.slice(2) || "/";
    if (p.startsWith("~/")) p = CASA + p.slice(1);
    const base = p.startsWith("/") ? [] : this.s.cwd.split("/").filter(Boolean);
    for (const parte of p.split("/").filter(Boolean)) { if (parte === ".") continue; if (parte === "..") base.pop(); else base.push(parte); }
    const r = "/" + base.join("/");
    return Object.keys(this.s.fs).find((k) => k.toLowerCase() === r.toLowerCase()) || r; // Windows no distingue mayúsculas
  },
  hijos(dir) { return Object.keys(this.s.fs).filter((k) => k !== dir && padre(k) === dir).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" })); },

  async completar(antes) {
    const m = antes.match(/(\S*)$/); const trozo = m[1].replace(/^["']/, "");
    const barra = Math.max(trozo.lastIndexOf("\\"), trozo.lastIndexOf("/"));
    const dir = this.ruta(barra >= 0 ? trozo.slice(0, barra + 1) || "\\" : ".");
    const pref = trozo.slice(barra + 1).toLowerCase();
    const op = this.hijos(dir).map(nombreDe).filter((n) => n.toLowerCase().startsWith(pref));
    if (op.length === 1) return { texto: op[0].slice(pref.length) + (this.s.fs[dir === "/" ? "/" + op[0] : dir + "/" + op[0]]?.t === "d" ? "\\" : "") };
    if (op.length > 1) return { opciones: op };
    return null;
  },

  // ---------- Ejecutar una línea ----------
  async ejecutar(linea) {
    const s = this.s, term = this.t.term;
    let texto = linea.trim();
    if (!texto) return;
    // Variables: $x = "hola"
    const asig = texto.match(/^\$(\w+)\s*=\s*(.+)$/);
    if (asig && s.modo === "ps") { s.vars[asig[1].toLowerCase()] = this.expandir(asig[2]).replace(/^["']|["']$/g, ""); this.guardar(); return; }
    texto = this.expandir(texto);
    const [primero, ...filtros] = texto.split(/\s+\|\s+/);
    let res = this.orden(primero, linea);
    if (res === "limpiar") { term.clear(); term.write("\x1b[2J\x1b[H"); return; }
    if (res === "modo") { term.options.theme = TEMAS[s.modo === "cmd" ? "cmd" : "powershell"]; this.guardar(); return; }
    for (const f of filtros) res = this.filtrar(res, f);
    const ps = s.modo === "ps";
    for (const l of res) {
      if (l && typeof l === "object" && l.error) {
        if (ps) {
          const orden = primero.split(/\s+/)[0];
          const nombre = CMDLET[orden.toLowerCase()] || orden;
          term.write(`\x1b[91m${nombre} : ${l.error}\r\nEn línea: 1 Carácter: 1\r\n+ ${linea}\r\n+ ${"~".repeat(Math.max(1, orden.length))}\r\n    + CategoryInfo          : ${l.cat || "ObjectNotFound"}: (${l.obj || ""}:String) [${nombre}], ${l.exc || "ItemNotFoundException"}\r\n    + FullyQualifiedErrorId : ${l.id || "PathNotFound"}\r\n\x1b[0m\r\n`);
        } else term.write(`${l.cmd || l.error}\r\n`);
      } else term.write(String(l).replace(/\r?\n/g, "\r\n") + "\r\n");
    }
    this.guardar();
  },
  expandir(t) {
    const s = this.s;
    return t.replace(/\$env:USERNAME/gi, "lorena").replace(/\$env:COMPUTERNAME/gi, "PC-LORENA").replace(/\$env:USERPROFILE/gi, "C:\\Users\\lorena")
      .replace(/%USERNAME%/gi, "lorena").replace(/%COMPUTERNAME%/gi, "PC-LORENA").replace(/%USERPROFILE%/gi, "C:\\Users\\lorena").replace(/%CD%/gi, aWin(s.cwd))
      .replace(/\$(\w+)/g, (m, v) => (v.toLowerCase() in s.vars ? s.vars[v.toLowerCase()] : m));
  },
  filtrar(res, f) {
    const [o, ...a] = f.trim().split(/\s+/);
    const q = a.join(" ").replace(/^["']|["']$/g, "").toLowerCase();
    const txt = res.filter((l) => typeof l === "string");
    switch (o.toLowerCase()) {
      case "findstr": case "select-string": case "sls": return txt.filter((l) => l.toLowerCase().includes(q.replace(/^\/i\s*/, "")));
      case "sort": case "sort-object": return [...txt].sort((x, y) => x.localeCompare(y, "es"));
      case "more": case "out-host": return txt;
      case "measure-object": case "measure": return ["", `Count    : ${txt.filter((l) => l.trim()).length}`, ""];
      default: return [{ error: `El término '${o}' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable.`, cmd: `"${o}" no se reconoce como un comando interno o externo,\r\nprograma o archivo por lotes ejecutable.`, cat: "ObjectNotFound", exc: "CommandNotFoundException", id: "CommandNotFoundException" }];
    }
  },

  orden(cmd, lineaOriginal) {
    const s = this.s;
    const out = [];
    const noExiste = (p) => ({ error: `No se encuentra la ruta de acceso '${aWin(p)}' porque no existe.`, cmd: "El sistema no puede encontrar la ruta especificada.", obj: aWin(p) });
    const redir = cmd.match(/^(.*?)\s*(>>?)\s*(\S+)\s*$/);
    let destino = null, anadir = false;
    if (redir && !/^(ping|tracert)\b/i.test(redir[1])) { cmd = redir[1]; destino = redir[3]; anadir = redir[2] === ">>"; }
    const partes = cmd.trim().match(/"[^"]*"|'[^']*'|\S+/g) || [];
    const args = partes.slice(1).map((a) => a.replace(/^["']|["']$/g, ""));
    const low = args.map((a) => a.toLowerCase());
    const opcion = (...n) => low.some((a) => n.includes(a));
    const valor = (n) => { const i = low.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
    const nom = args.filter((a, i) => !/^[-/]/.test(a) && !(i > 0 && /^-(itemtype|type|name|path|destination|newname|value|filter|name)$/i.test(args[i - 1])));
    let o = (partes[0] || "").toLowerCase();
    if (/^cd(\\|\.\.)/.test(o)) { nom.unshift(o.slice(2)); o = "cd"; } // cd\ y cd..
    const escribir = (lineasSalida) => {
      if (!destino) return lineasSalida;
      const p = this.ruta(destino);
      if (!s.fs[padre(p)]) return [noExiste(padre(p))];
      const txt = lineasSalida.filter((l) => typeof l === "string").join("\r\n");
      s.fs[p] = { t: "f", c: (anadir && s.fs[p]?.c ? s.fs[p].c + "\r\n" : "") + txt, m: Date.now() };
      return [];
    };
    const crearDir = (p) => { let acc = ""; for (const tr of p.split("/").filter(Boolean)) { acc += "/" + tr; s.fs[acc] ||= { t: "d", m: Date.now() }; } };

    switch (o) {
      case "help": case "get-help": case "/?": case "man":
        return escribir(["", "Órdenes que puedes probar (CMD y PowerShell):", "", ...AYUDA.map(([k, v]) => `  ${k.padEnd(46)} ${v}`), ""]);
      case "cls": case "clear": case "clear-host": return "limpiar";
      case "cmd": if (s.modo === "cmd") return []; s.modo = "cmd"; this.t.term.write("Microsoft Windows [Versión 10.0.22631.4169]\r\n(c) Microsoft Corporation. Todos los derechos reservados.\r\n\r\n"); return "modo";
      case "powershell": case "pwsh": if (s.modo === "ps") return []; s.modo = "ps"; this.t.term.write("Windows PowerShell\r\nCopyright (C) Microsoft Corporation. Todos los derechos reservados.\r\n\r\n"); return "modo";
      case "exit": if (s.modo === "cmd") { s.modo = "ps"; return "modo"; } return ["(Aquí no se cierra la ventana. Usa cmd o powershell para cambiar.)"];
      case "reset": this.reiniciar(); return "limpiar";
      case "history": case "get-history": case "h": case "doskey": return escribir(this.ed.hist.map((h, i) => `${String(i + 1).padStart(4)} ${h}`));
      case "whoami": return escribir(["pc-lorena\\lorena"]);
      case "hostname": return escribir(["PC-LORENA"]);
      case "ver": return escribir(["", "Microsoft Windows [Versión 10.0.22631.4169]"]);
      case "$psversiontable": return escribir(["", "Name                           Value", "----                           -----", "PSVersion                      5.1.22621.4111", "PSEdition                      Desktop", "BuildVersion                   10.0.22621.4111", ""]);
      case "get-date": case "date": case "time": return escribir([s.modo === "ps" ? new Date().toLocaleString("es-ES", { dateStyle: "full", timeStyle: "medium" }) : `La fecha actual es: ${new Date().toLocaleDateString("es-ES")}`]);
      case "echo": case "write-output": case "write-host": case "write": return escribir([args.join(" ")]);
      case "pwd": case "get-location": case "gl":
        return escribir(s.modo === "ps" ? ["", "Path", "----", aWin(s.cwd), ""] : [aWin(s.cwd)]);
      case "cd": case "chdir": case "set-location": case "sl": {
        const a = nom[0] ?? valor("-path");
        if (a === undefined || a === "") return s.modo === "cmd" ? [aWin(s.cwd)] : [];
        const p = this.ruta(a === "\\" ? "/" : a);
        if (!s.fs[p]) return [noExiste(p)];
        if (s.fs[p].t !== "d") return [{ error: `No se encuentra la ruta de acceso '${aWin(p)}' porque no es una carpeta.`, cmd: "El nombre del directorio no es válido." }];
        s.cwd = p; this.reto("cd", p); return [];
      }
      case "dir": case "ls": case "gci": case "get-childitem": {
        const p = this.ruta(nom[0] ?? valor("-path") ?? ".");
        if (!s.fs[p]) return [s.modo === "cmd" ? { error: "", cmd: "No se encuentra el archivo" } : noExiste(p)];
        const hs = s.fs[p].t === "d" ? this.hijos(p) : [p];
        const soloNombres = opcion("/b", "-name");
        if (soloNombres) return escribir(hs.map(nombreDe));
        if (s.modo === "cmd") {
          const dirs = hs.filter((k) => s.fs[k].t === "d"), fich = hs.filter((k) => s.fs[k].t === "f");
          const bytes = fich.reduce((a, k) => a + (s.fs[k].c?.length || 0), 0);
          return escribir([" El volumen de la unidad C no tiene etiqueta.", " El número de serie del volumen es: 7A3C-1F2E", "", ` Directorio de ${aWin(s.fs[p].t === "d" ? p : padre(p))}`, "",
            ...(p !== "/" ? [`${fechaCorta(s.fs[p].m)}    <DIR>          .`, `${fechaCorta(s.fs[p].m)}    <DIR>          ..`] : []),
            ...hs.map((k) => `${fechaCorta(s.fs[k].m)}    ${s.fs[k].t === "d" ? "<DIR>         " : miles(s.fs[k].c?.length || 0).padStart(14)} ${nombreDe(k)}`),
            `${String(fich.length).padStart(16)} archivos${miles(bytes).padStart(15)} bytes`, `${String(dirs.length + (p !== "/" ? 2 : 0)).padStart(16)} dirs  52.314.112.000 bytes libres`]);
        }
        return escribir(["", `    Directorio: ${aWin(s.fs[p].t === "d" ? p : padre(p))}`, "", "", "Mode                 LastWriteTime         Length Name", "----                 -------------         ------ ----",
          ...hs.map((k) => `${s.fs[k].t === "d" ? "d-----" : "-a----"}        ${fechaPs(s.fs[k].m)}  ${s.fs[k].t === "d" ? "      " : String(s.fs[k].c?.length || 0).padStart(6)} ${nombreDe(k)}`), ""]);
      }
      case "tree": {
        const p = this.ruta(nom[0] || ".");
        const r = [`Listado de rutas de carpetas`, `El número de serie del volumen es 7A3C-1F2E`, aWin(p)];
        const pinta = (dir, pre) => { const hs = this.hijos(dir).filter((k) => s.fs[k].t === "d" || opcion("/f")); hs.forEach((k, i) => { const ult = i === hs.length - 1; r.push(`${pre}${s.fs[k].t === "d" ? (ult ? "└───" : "├───") : "    "}${nombreDe(k)}`); if (s.fs[k].t === "d") pinta(k, pre + (ult ? "    " : "│   ")); }); };
        pinta(p, ""); return escribir(r);
      }
      case "mkdir": case "md": {
        if (!nom.length) return [{ error: "Falta el nombre de la carpeta.", cmd: "La sintaxis del comando no es correcta." }];
        const r = [];
        for (const n of nom) {
          const p = this.ruta(n);
          if (s.fs[p]) { r.push({ error: `Ya existe un elemento con el nombre especificado: ${aWin(p)}.`, cmd: `Ya existe el subdirectorio o el archivo ${n}.`, cat: "ResourceExists", exc: "IOException", id: "DirectoryExist" }); continue; }
          crearDir(p); this.reto("mkdir", p);
          if (s.modo === "ps") r.push("", `    Directorio: ${aWin(padre(p))}`, "", "", "Mode                 LastWriteTime         Length Name", "----                 -------------         ------ ----", `d-----        ${fechaPs(Date.now())}                ${nombreDe(p)}`, "");
        }
        return r;
      }
      case "new-item": case "ni": {
        const tipo = (valor("-itemtype") || valor("-type") || "file").toLowerCase();
        const n = valor("-name") || nom[0]; const dir = valor("-path");
        if (!n && !dir) return [{ error: "Falta el nombre. Ejemplo: New-Item notas.txt" }];
        const p = this.ruta(dir && valor("-name") ? `${dir}/${n}` : (n || dir));
        if (s.fs[p]) return [{ error: `El elemento con el nombre especificado ${aWin(p)} ya existe.`, cat: "ResourceExists", exc: "IOException", id: "NewItemIOError" }];
        if (!s.fs[padre(p)]) return [noExiste(padre(p))];
        if (tipo.startsWith("dir")) { crearDir(p); this.reto("mkdir", p); } else s.fs[p] = { t: "f", c: valor("-value") || "", m: Date.now() };
        return ["", `    Directorio: ${aWin(padre(p))}`, "", "", "Mode                 LastWriteTime         Length Name", "----                 -------------         ------ ----",
          `${tipo.startsWith("dir") ? "d-----" : "-a----"}        ${fechaPs(Date.now())}  ${tipo.startsWith("dir") ? "      " : String((valor("-value") || "").length).padStart(6)} ${nombreDe(p)}`, ""];
      }
      case "set-content": case "add-content": case "sc": case "ac": case "out-file": {
        const n = valor("-path") || valor("-filepath") || nom[0]; const v = valor("-value") ?? nom[1] ?? "";
        const p = this.ruta(n || "");
        if (!n) return [{ error: "Ejemplo: Set-Content notas.txt \"hola\"" }];
        if (!s.fs[padre(p)]) return [noExiste(padre(p))];
        s.fs[p] = { t: "f", c: (o.startsWith("a") && s.fs[p]?.c ? s.fs[p].c + "\r\n" : "") + v, m: Date.now() };
        return [];
      }
      case "type": case "cat": case "gc": case "get-content": {
        const r = [];
        for (const n of nom.length ? nom : [valor("-path")]) {
          const p = this.ruta(n); const x = s.fs[p];
          if (!x) r.push({ ...noExiste(p), cmd: "El sistema no puede encontrar el archivo especificado." });
          else if (x.t === "d") r.push({ error: `Acceso denegado a la ruta de acceso '${aWin(p)}'.`, cmd: "Acceso denegado.", cat: "PermissionDenied", exc: "UnauthorizedAccessException", id: "GetContentReaderUnauthorizedAccessError" });
          else r.push(...x.c.split(/\r?\n/));
        }
        return escribir(r);
      }
      case "del": case "erase": case "rm": case "ri": case "remove-item": case "rmdir": case "rd": {
        if (!nom.length) return [{ error: "Falta la ruta.", cmd: "La sintaxis del comando no es correcta." }];
        const rec = opcion("/s", "-recurse", "-r", "-rf");
        const r = [];
        for (const n of nom) {
          const p = this.ruta(n);
          if (!s.fs[p]) { r.push({ ...noExiste(p), cmd: "No se pudo encontrar " + aWin(p) }); continue; }
          if (["/", "/Windows", "/Users", CASA, "/Windows/System32"].includes(p)) { r.push({ error: `Acceso denegado a la ruta de acceso '${aWin(p)}'.`, cmd: "Acceso denegado.", cat: "PermissionDenied", exc: "UnauthorizedAccessException", id: "RemoveItemUnauthorizedAccessError" }); continue; }
          if (["del", "erase"].includes(o) && s.fs[p].t === "d") { r.push({ error: "", cmd: `${aWin(p)}\\*, ¿Está seguro (S/N)? S` }); for (const k of this.hijos(p)) if (s.fs[k].t === "f") delete s.fs[k]; continue; }
          if (["rmdir", "rd"].includes(o) && s.fs[p].t !== "d") { r.push({ error: "", cmd: "El nombre del directorio no es válido." }); continue; }
          if (s.fs[p].t === "d" && this.hijos(p).length && !rec) {
            if (s.modo === "cmd" || ["rmdir", "rd"].includes(o)) { r.push({ error: "El directorio no está vacío.", cmd: "El directorio no está vacío." }); continue; }
            r.push(`Confirmar`, `El elemento situado en ${aWin(p)} tiene elementos secundarios y no se especificó el parámetro Recurse.`, "(Para practicar: añade -Recurse)"); continue;
          }
          for (const k of Object.keys(s.fs)) if (k === p || k.startsWith(p + "/")) delete s.fs[k];
          this.reto("rm", p);
        }
        return r;
      }
      case "copy": case "cp": case "copy-item": case "cpi": case "xcopy": case "move": case "mv": case "move-item": case "mi": {
        const a = nom[0] || valor("-path"), b = nom[1] || valor("-destination");
        if (!a || !b) return [{ error: "Falta el destino. Ejemplo: copy leeme.txt ..\\practicas", cmd: "La sintaxis del comando no es correcta." }];
        const or = this.ruta(a); let de = this.ruta(b);
        if (!s.fs[or]) return [{ ...noExiste(or), cmd: "El sistema no puede encontrar el archivo especificado." }];
        if (s.fs[de]?.t === "d") de = `${de === "/" ? "" : de}/${nombreDe(or)}`;
        if (!s.fs[padre(de)]) return [noExiste(padre(de))];
        const mover = o.startsWith("m");
        if (s.fs[or].t === "d" && !mover && !opcion("-recurse", "/e", "/s") && o !== "xcopy") return [{ error: "Para copiar una carpeta con lo que tiene, añade -Recurse.", cmd: "Para copiar carpetas usa xcopy /e" }];
        let n = 0;
        for (const k of Object.keys(s.fs)) if (k === or || k.startsWith(or + "/")) { s.fs[de + k.slice(or.length)] = { ...s.fs[k], m: Date.now() }; if (s.fs[k].t === "f") n++; if (mover) delete s.fs[k]; }
        this.reto(mover ? "mv" : "cp", de);
        if (s.modo === "cmd" || !o.includes("-")) return o.includes("-") ? [] : [mover ? `        1 archivo(s) movido(s).` : o === "xcopy" ? `${n} Archivo(s) copiado(s)` : `        1 archivo(s) copiado(s).`];
        return [];
      }
      case "ren": case "rename": case "rename-item": case "rni": {
        const a = nom[0] || valor("-path"), b = nom[1] || valor("-newname");
        const or = this.ruta(a || "");
        if (!a || !b) return [{ error: "Ejemplo: ren viejo.txt nuevo.txt", cmd: "La sintaxis del comando no es correcta." }];
        if (!s.fs[or]) return [{ ...noExiste(or), cmd: "El sistema no puede encontrar el archivo especificado." }];
        const de = `${padre(or) === "/" ? "" : padre(or)}/${b}`;
        for (const k of Object.keys(s.fs)) if (k === or || k.startsWith(or + "/")) { s.fs[de + k.slice(or.length)] = s.fs[k]; delete s.fs[k]; }
        return [];
      }
      case "ipconfig": {
        this.reto("ipconfig");
        if (opcion("/release")) { s.sinIp = true; return ["", "Configuración IP de Windows", "", "Adaptador de Ethernet Ethernet:", "", "   Sufijo DNS específico para la conexión. . :", "   Vínculo: dirección IPv6 local. . . : fe80::a00:27ff:fe3a:1c5e%12"]; }
        if (opcion("/renew")) s.sinIp = false;
        if (opcion("/flushdns")) return ["", "Configuración IP de Windows", "", "Se vació correctamente la caché de resolución de DNS."];
        const r = ["", "Configuración IP de Windows", ""];
        if (opcion("/all")) r.push("   Nombre de host. . . . . . . . . : PC-LORENA", "   Sufijo DNS principal  . . . . . : ", "   Tipo de nodo. . . . . . . . . . : híbrido", "   Enrutamiento IP habilitado. . . : no", "");
        r.push("Adaptador de Ethernet Ethernet:", "", "   Sufijo DNS específico para la conexión. . : home");
        if (opcion("/all")) r.push("   Descripción . . . . . . . . . . . . . . . : Intel(R) PRO/1000 MT Desktop Adapter", "   Dirección física. . . . . . . . . . . . . : 08-00-27-3A-1C-5E", "   DHCP habilitado . . . . . . . . . . . . . : sí", "   Configuración automática habilitada . . . : sí");
        r.push("   Vínculo: dirección IPv6 local. . . : fe80::a00:27ff:fe3a:1c5e%12");
        if (s.sinIp) r.push("   Dirección IPv4 de configuración automática: 169.254.28.94", "   Máscara de subred . . . . . . . . . . . . : 255.255.0.0", "   Puerta de enlace predeterminada . . . . . :");
        else r.push(`   Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.37${opcion("/all") ? "(Preferido)" : ""}`, "   Máscara de subred . . . . . . . . . . . . : 255.255.255.0", "   Puerta de enlace predeterminada . . . . . : 192.168.1.1");
        if (opcion("/all") && !s.sinIp) r.push("   Concesión obtenida. . . . . . . . . . . . : " + new Date(Date.now() - 3600e3).toLocaleString("es-ES"), "   Servidor DHCP . . . . . . . . . . . . . . : 192.168.1.1", "   Servidores DNS. . . . . . . . . . . . . . : 8.8.8.8", "                                               1.1.1.1", "   NetBIOS sobre TCP/IP. . . . . . . . . . . : habilitado");
        return escribir(r);
      }
      case "ping": case "test-connection": {
        const h = nom[0];
        if (!h) return ["", "Uso: ping [-t] [-n cuenta] [-l tamaño] nombre_destino"];
        const n = Number(valor("-n") || valor("-count")) || 4;
        const ipDe = { "google.com": "142.250.184.14", "www.google.com": "142.250.184.4", localhost: "::1", "127.0.0.1": "127.0.0.1", "192.168.1.1": "192.168.1.1", "8.8.8.8": "8.8.8.8", "1.1.1.1": "1.1.1.1" };
        const ip = ipDe[h.toLowerCase()] || (/^\d+\.\d+\.\d+\.\d+$/.test(h) ? h : null);
        if (s.sinIp && ip !== "127.0.0.1") return ["", "Error general. (No tienes IP: haz ipconfig /renew)"];
        if (!ip) return [`La solicitud de ping no pudo encontrar el host ${h}. Compruebe el nombre y vuelva a intentarlo.`];
        const local = /^192\.168\.1\.\d+$/.test(ip) && ip !== "192.168.1.1" && ip !== "192.168.1.37";
        this.reto("ping");
        const r = ["", `Haciendo ping a ${h}${h !== ip ? ` [${ip}]` : ""} con 32 bytes de datos:`];
        const tiempos = [];
        for (let i = 0; i < n; i++) {
          if (local) { r.push(`Respuesta desde 192.168.1.37: Host de destino inaccesible.`); continue; }
          const t = ip.startsWith("127") || ip === "::1" ? 0 : ip === "192.168.1.1" ? 1 : Math.round(9 + Math.random() * 9);
          tiempos.push(t); r.push(`Respuesta desde ${ip}: bytes=32 tiempo${t < 1 ? "<1" : "=" + t}ms TTL=${ip === "192.168.1.1" ? 64 : ip.startsWith("127") ? 128 : 117}`);
        }
        r.push("", `Estadísticas de ping para ${ip}:`, `    Paquetes: enviados = ${n}, recibidos = ${n}, perdidos = 0`, "    (0% perdidos),");
        if (tiempos.length) r.push("Tiempos aproximados de ida y vuelta en milisegundos:", `    Mínimo = ${Math.min(...tiempos)}ms, Máximo = ${Math.max(...tiempos)}ms, Media = ${Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)}ms`);
        return escribir(r);
      }
      case "tracert": return escribir(["", `Traza a ${nom[0] || "google.com"} [142.250.184.14]`, "sobre un máximo de 30 saltos:", "", "  1    <1 ms    <1 ms    <1 ms  192.168.1.1", "  2     7 ms     6 ms     7 ms  10.20.0.1", "  3     9 ms     8 ms     9 ms  172.16.30.1", "  4    12 ms    11 ms    12 ms  mad07s24-in-f14.1e100.net [142.250.184.14]", "", "Traza completa."]);
      case "nslookup": return escribir([`Servidor:  dns.google`, "Address:  8.8.8.8", "", "Respuesta no autoritativa:", `Nombre:  ${nom[0] || "google.com"}`, `Addresses:  2a00:1450:4003:80f::200e`, "          142.250.184.14"]);
      case "netstat": return escribir(["", "Conexiones activas", "", "  Proto  Dirección local          Dirección remota        Estado", "  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING", "  TCP    0.0.0.0:445            0.0.0.0:0              LISTENING", "  TCP    192.168.1.37:52144     142.250.184.14:443     ESTABLISHED", "  TCP    192.168.1.37:52150     140.82.121.4:443       ESTABLISHED", "  UDP    0.0.0.0:5353           *:*"]);
      case "arp": return escribir(["", "Interfaz: 192.168.1.37 --- 0xc", "  Dirección de Internet          Dirección física      Tipo", "  192.168.1.1           a4-2b-b0-11-22-33     dinámico", "  192.168.1.255         ff-ff-ff-ff-ff-ff     estático"]);
      case "getmac": return escribir(["", "Dirección física    Nombre de transporte", "=================== ==========================================================", "08-00-27-3A-1C-5E   \\Device\\Tcpip_{4B2E7A10-9C3D-4E7F-8A21-6D5C0B1E2F34}"]);
      case "tasklist": case "get-process": case "ps": case "gps":
        return escribir(s.modo === "ps" && o !== "tasklist"
          ? ["", "Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName", "-------  ------    -----      -----     ------     --  -- -----------", "   1890      98   185340     243112      41,20   7788   1 chrome", "    812      45    94120     101234      12,03   9012   1 Code", "   2410     120    60120      98300       8,77   4120   1 explorer", "    102       9     1720       6120       0,02    512   0 svchost", "      0       0       60          8                 0   0 Idle", ""]
          : ["", "Nombre de imagen               PID Nombre de sesión Núm. de ses Uso de memor", "========================= ======== ================ =========== ============", "System Idle Process              0 Services                   0         8 KB", "System                           4 Services                   0       144 KB", "svchost.exe                    512 Services                   0     6.120 KB", "explorer.exe                  4120 Console                    1    98.300 KB", "chrome.exe                    7788 Console                    1   243.112 KB", "Code.exe                      9012 Console                    1   101.234 KB"]);
      case "get-service": case "gsv": return escribir(["", "Status   Name               DisplayName", "------   ----               -----------", "Running  Dhcp               Cliente DHCP", "Running  Dnscache           Cliente DNS", "Stopped  Fax                Fax", "Running  LanmanServer       Servidor", "Running  Spooler            Cola de impresión", "Running  WinDefend          Servicio Antivirus de Microsoft Defender", "Stopped  wuauserv           Windows Update", ""]);
      case "systeminfo": return escribir(["", "Nombre de host:                            PC-LORENA", "Nombre del sistema operativo:              Microsoft Windows 11 Pro", "Versión del sistema operativo:             10.0.22631 N/D Compilación 22631", "Fabricante del sistema operativo:          Microsoft Corporation", "Configuración del sistema operativo:       Estación de trabajo independiente", "Propiedad de:                              lorena", "Fabricante del sistema:                    innotek GmbH", "Modelo el sistema:                         VirtualBox", "Tipo de sistema:                           x64-based PC", "Procesador(es):                            1 procesadores instalados.", "Memoria física total:                      8.192 MB", "Dominio:                                   WORKGROUP", "Tarjeta(s) de red:                         1 Tarjetas de interfaz de red instaladas."]);
      case "shutdown": return ["(Simulación: no se apaga nada. En real: shutdown /s /t 0 apaga y shutdown /r reinicia.)"];
      case "sudo": return [{ error: "En Windows no hay sudo: abre PowerShell con «Ejecutar como administrador».", cmd: "\"sudo\" no se reconoce como un comando interno o externo,\r\nprograma o archivo por lotes ejecutable." }];
      default:
        return [{ error: `El término '${partes[0]}' no se reconoce como nombre de un cmdlet, función, archivo de script o programa ejecutable. Compruebe si escribió correctamente el nombre o, si incluyó una ruta de acceso, compruebe que dicha ruta es correcta e inténtelo de nuevo.`, cmd: `"${partes[0]}" no se reconoce como un comando interno o externo,\r\nprograma o archivo por lotes ejecutable.`, obj: partes[0], exc: "CommandNotFoundException", id: "CommandNotFoundException" }];
    }
  },

  // ---------- Retos ----------
  reto(tipo, p) {
    const r = this.s.retos;
    if (tipo === "cd" && p === CASA + "/Documentos") r.docs = true;
    if (tipo === "mkdir" && p === CASA + "/practicas") r.carpeta = true;
    if (tipo === "cp" && p.toLowerCase() === (CASA + "/practicas/leeme.txt").toLowerCase()) r.copia = true;
    if (tipo === "ipconfig") r.ip = true;
    if (tipo === "ping") r.ping = true;
    if (tipo === "mkdir" && p.toLowerCase() === "/temp/basura") r.basura1 = true;
    if (tipo === "rm" && p.toLowerCase() === "/temp/basura" && r.basura1) r.basura = true;
  },
  retos() {
    const r = this.s?.retos || {};
    const notas = this.s?.fs[CASA + "/practicas/notas.txt"]?.c?.trim() === "hola";
    return [
      ["Entra en tu carpeta Documentos", r.docs], ["Crea la carpeta practicas en C:\\Users\\lorena", r.carpeta || Boolean(this.s?.fs[CASA + "/practicas"])],
      ["Crea practicas\\notas.txt con el texto «hola»", notas], ["Copia leeme.txt a practicas", r.copia],
      ["Mira tu IP con ipconfig", r.ip], ["Haz ping a google.com", r.ping], ["Crea C:\\Temp\\basura y después bórrala", r.basura],
    ];
  },
};
