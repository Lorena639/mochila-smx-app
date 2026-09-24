// =============================================================
//  consolas.js — Consolas de práctica (simuladas, sin riesgo)
//   · Terminal Linux (Bash) con git simulado
//   · Windows (CMD y PowerShell)
//  Nada de lo que se escribe aquí toca el ordenador de verdad.
// =============================================================
import { esc } from "./comun.js";
import { icono } from "./iconos.js";

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
  "ip a": "Tus direcciones IP", ping: "Comprueba si un equipo responde", history: "Comandos que has escrito", git: "Control de versiones (git init, add, commit, log, branch…)", help: "Esta ayuda", reset: "Vuelve a empezar desde cero",
};
function estadoLinux(t) {
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
    case "reset": Object.assign(s, { fs: INICIO_FS(), cwd: "/home/lorena", lineas: [], hist: [], creoBasura: false, git: null }); return ["Terminal reiniciada."];
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
    case "git": out.push(...git(s, args)); break;
    case "man": out.push(AYUDA[nom[0]] ? `${nom[0]}: ${AYUDA[nom[0]]}` : "No hay manual para eso aquí. Escribe «help»."); break;
    default: err(`${partes[0]}: orden no encontrada. Escribe «help» para ver lo que se puede probar.`);
  }
  return out;
}
// ---------- Git (simulado, dentro de la terminal Linux) ----------
const hex7 = () => Math.random().toString(16).slice(2, 9).padEnd(7, "0");
function archivosRepo(s) {
  const r = s.git.dir;
  return Object.keys(s.fs).filter((k) => s.fs[k].t === "f" && k.startsWith(r + "/")).sort();
}
function git(s, args) {
  const [sub, ...resto] = args;
  const out = [];
  const nombre = (k) => k.slice(s.git.dir.length + 1);
  if (!sub || sub === "help" || sub === "--help") return ["Órdenes de git que se pueden probar aquí:", "  git init · git status · git add <archivo|.> · git commit -m \"mensaje\"", "  git log [--oneline] · git branch [nombre] · git switch <rama> · git switch -c <rama>", "  git checkout -b <rama> · git diff · git restore --staged <archivo>"];
  if (sub === "--version" || sub === "version") return ["git version 2.43.0 (simulado)"];
  if (sub === "init") {
    if (s.git && s.cwd.startsWith(s.git.dir)) return [`Reinicializado el repositorio Git existente en ${s.git.dir}/.git/`];
    s.git = { dir: s.cwd === "/" ? "" : s.cwd, rama: "main", ramas: { main: null }, commits: {}, stage: {} };
    return [`Inicializado repositorio Git vacío en ${s.cwd}/.git/`];
  }
  if (sub === "clone") return ["(Simulación) Aquí no hay internet. En real: git clone https://github.com/usuario/repo.git", "Prueba mejor: mkdir proyecto, cd proyecto, git init"];
  if (!s.git || !(s.cwd + "/").startsWith(s.git.dir + "/")) return ["fatal: no es un repositorio git (ni ninguno de los directorios superiores): .git", "Pista: primero escribe git init dentro de una carpeta."];
  const g = s.git;
  const head = g.ramas[g.rama] ? g.commits[g.ramas[g.rama]] : null;
  const snap = head ? head.snap : {};
  const actual = (k) => s.fs[k]?.c ?? null;
  const preparado = (k) => (k in g.stage ? g.stage[k] : (k in snap ? snap[k] : undefined));
  switch (sub) {
    case "status": {
      const archivos = archivosRepo(s);
      const todos = [...new Set([...archivos, ...Object.keys(snap), ...Object.keys(g.stage)])].sort();
      const listos = todos.filter((k) => k in g.stage && g.stage[k] !== snap[k]);
      const cambiados = todos.filter((k) => preparado(k) !== undefined && actual(k) !== preparado(k));
      const nuevos = archivos.filter((k) => preparado(k) === undefined);
      out.push(`En la rama ${g.rama}`);
      if (!head) out.push("", "No hay commits todavía");
      if (listos.length) out.push("", "Cambios a ser confirmados (irán en el próximo commit):", ...listos.map((k) => `        ${g.stage[k] === null ? "borrado" : k in snap ? "modificado" : "nuevo archivo"}:  ${nombre(k)}`));
      if (cambiados.length) out.push("", "Cambios no preparados (usa git add):", ...cambiados.map((k) => `        ${actual(k) === null ? "borrado" : "modificado"}:  ${nombre(k)}`));
      if (nuevos.length) out.push("", "Archivos sin seguimiento (usa git add para incluirlos):", ...nuevos.map((k) => `        ${nombre(k)}`));
      if (!listos.length && !cambiados.length && !nuevos.length) out.push(head ? "nada para hacer commit, el árbol de trabajo está limpio" : "nada para hacer commit (crea archivos y usa git add)");
      return out;
    }
    case "add": {
      if (!resto.length) return ["Nada especificado, nada agregado.", "Quizás quisiste decir 'git add .'?"];
      const archivos = archivosRepo(s);
      for (const a of resto) {
        if (a === "." || a === "-A" || a === "--all") {
          for (const k of archivos) g.stage[k] = actual(k);
          for (const k of Object.keys(snap)) if (actual(k) === null) g.stage[k] = null;
          continue;
        }
        const k = ruta(s, a);
        if (s.fs[k]?.t === "d") { for (const x of archivos) if (x.startsWith(k + "/")) g.stage[x] = actual(x); continue; }
        if (actual(k) === null && !(k in snap)) { out.push(`fatal: ruta especificada '${a}' no concordó con ningún archivo`); continue; }
        g.stage[k] = actual(k);
      }
      return out;
    }
    case "restore": {
      const archivos = resto.filter((a) => !a.startsWith("-"));
      for (const a of archivos) { const k = ruta(s, a); if (resto.includes("--staged")) delete g.stage[k]; else if (k in snap) s.fs[k] = { t: "f", c: snap[k], p: "644" }; }
      return out;
    }
    case "commit": {
      const i = resto.indexOf("-m");
      const msg = i >= 0 ? resto[i + 1] : null;
      if (resto.includes("-a") || resto.includes("-am")) for (const k of Object.keys(snap)) g.stage[k] = actual(k);
      const msg2 = msg || (resto.includes("-am") ? resto[resto.indexOf("-am") + 1] : null);
      if (!msg2) return ["Falta el mensaje. Usa: git commit -m \"lo que has cambiado\""];
      const cambios = Object.keys(g.stage).filter((k) => g.stage[k] !== snap[k]);
      if (!cambios.length) return [`En la rama ${g.rama}`, "nada para hacer commit (usa git add para preparar archivos)"];
      const nuevo = { ...snap };
      for (const k of cambios) { if (g.stage[k] === null) delete nuevo[k]; else nuevo[k] = g.stage[k]; }
      const id = hex7();
      g.commits[id] = { id, msg: msg2, padre: g.ramas[g.rama], snap: nuevo, fecha: new Date().toString() };
      g.ramas[g.rama] = id;
      g.stage = {};
      return [`[${g.rama}${head ? "" : " (commit-raíz)"} ${id}] ${msg2}`, ` ${cambios.length} archivo${cambios.length === 1 ? "" : "s"} cambiado${cambios.length === 1 ? "" : "s"}`];
    }
    case "log": {
      if (!head) return [`fatal: tu rama actual '${g.rama}' no tiene ningún commit todavía`];
      let c = head;
      const corto = resto.includes("--oneline");
      while (c) {
        const ramas = Object.entries(g.ramas).filter(([, v]) => v === c.id).map(([k]) => (k === g.rama ? `HEAD -> ${k}` : k));
        if (corto) out.push(`${c.id}${ramas.length ? ` (${ramas.join(", ")})` : ""} ${c.msg}`);
        else out.push(`commit ${c.id}${"0".repeat(33)}${ramas.length ? ` (${ramas.join(", ")})` : ""}`, "Author: Lorena <lorena@ejemplo.com>", `Date:   ${c.fecha}`, "", `    ${c.msg}`, "");
        c = c.padre ? g.commits[c.padre] : null;
      }
      return out;
    }
    case "diff": {
      for (const k of archivosRepo(s)) {
        const antes = preparado(k);
        if (antes === undefined || antes === actual(k)) continue;
        out.push(`diff --git a/${nombre(k)} b/${nombre(k)}`, ...String(antes ?? "").split("\n").map((x) => `- ${x}`), ...String(actual(k)).split("\n").map((x) => `+ ${x}`));
      }
      return out.length ? out : ["(sin cambios sin preparar)"];
    }
    case "branch": {
      const n = resto.find((a) => !a.startsWith("-"));
      if (resto.includes("-d") || resto.includes("-D")) {
        if (n === g.rama) return [`error: no se puede borrar la rama '${n}' porque estás en ella`];
        if (!(n in g.ramas)) return [`error: rama '${n}' no encontrada.`];
        delete g.ramas[n]; return [`Eliminada la rama ${n}.`];
      }
      if (!n) return Object.keys(g.ramas).sort().map((k) => `${k === g.rama ? "*" : " "} ${k}`);
      if (!head) return [`fatal: no es un nombre de objeto válido: '${g.rama}' (haz primero un commit)`];
      if (n in g.ramas) return [`fatal: ya existe una rama llamada '${n}'.`];
      g.ramas[n] = g.ramas[g.rama];
      return [];
    }
    case "switch": case "checkout": {
      const crear = resto.includes("-c") || resto.includes("-b");
      const n = resto.find((a) => !a.startsWith("-"));
      if (!n) return ["fatal: falta el nombre de la rama"];
      if (crear) {
        if (n in g.ramas) return [`fatal: ya existe una rama llamada '${n}'.`];
        g.ramas[n] = g.ramas[g.rama]; g.rama = n;
        return [`Cambiado a nueva rama '${n}'`];
      }
      if (!(n in g.ramas)) return [`fatal: referencia no válida: ${n}`];
      // Cambiar de rama: los archivos pasan a ser los de esa rama
      const destino = g.ramas[n] ? g.commits[g.ramas[n]].snap : {};
      for (const k of Object.keys(snap)) if (!(k in destino)) delete s.fs[k];
      for (const [k, c] of Object.entries(destino)) s.fs[k] = { t: "f", c, p: "644" };
      g.rama = n; g.stage = {};
      return [`Cambiado a rama '${n}'`];
    }
    case "merge": {
      const n = resto[0];
      if (!(n in g.ramas) || !g.ramas[n]) return [`merge: ${n} - no es algo que podamos fusionar`];
      const otra = g.commits[g.ramas[n]];
      const nuevo = { ...snap, ...otra.snap };
      for (const [k, c] of Object.entries(otra.snap)) s.fs[k] = { t: "f", c, p: "644" };
      const id = hex7();
      g.commits[id] = { id, msg: `Merge branch '${n}'`, padre: g.ramas[g.rama], snap: nuevo, fecha: new Date().toString() };
      g.ramas[g.rama] = id;
      return [`Merge made by the 'ort' strategy. (${Object.keys(otra.snap).length} archivos)`];
    }
    case "remote": case "push": case "pull": case "fetch":
      return ["(Simulación) Aquí no hay conexión con GitHub.", "En real: git remote add origin https://github.com/usuario/repo.git", "y después: git push -u origin main"];
    default: return [`git: '${sub}' no es un comando de git (en este simulador). Mira 'git help'.`];
  }
}

// ---------- Windows: CMD y PowerShell (simulado) ----------
const INICIO_WIN = () => ({
  "/": { t: "d" }, "/Users": { t: "d" }, "/Users/lorena": { t: "d" }, "/Users/lorena/Documentos": { t: "d" },
  "/Users/lorena/Descargas": { t: "d" }, "/Users/lorena/Escritorio": { t: "d" },
  "/Users/lorena/Documentos/leeme.txt": { t: "f", c: "Bienvenida a la consola de Windows de práctica.\nEscribe «help» para ver los comandos." },
  "/Windows": { t: "d" }, "/Windows/System32": { t: "d" }, "/Windows/System32/drivers": { t: "d" },
  "/Windows/System32/drivers/etc": { t: "d" }, "/Windows/System32/drivers/etc/hosts": { t: "f", c: "127.0.0.1       localhost" },
  "/Program Files": { t: "d" },
});
const CASA_WIN = "/Users/lorena";
export const aWin = (p) => "C:" + (p === "/" ? "\\" : p.replace(/\//g, "\\"));
function rutaWin(s, p) {
  p = String(p || "").replace(/^["']|["']$/g, "").replace(/\\/g, "/");
  if (!p || p === "~") return CASA_WIN;
  if (/^[a-z]:/i.test(p)) p = p.slice(2) || "/";
  if (p.startsWith("~/")) p = CASA_WIN + p.slice(1);
  if (p.startsWith("$HOME") || p.startsWith("$env:USERPROFILE")) p = CASA_WIN + p.replace(/^\$(HOME|env:USERPROFILE)/, "");
  const base = p.startsWith("/") ? [] : s.cwd.split("/").filter(Boolean);
  for (const parte of p.split("/").filter(Boolean)) { if (parte === ".") continue; if (parte === "..") base.pop(); else base.push(parte); }
  const r = "/" + base.join("/");
  // Windows no distingue mayúsculas: busca la ruta que ya exista
  return Object.keys(s.fs).find((k) => k.toLowerCase() === r.toLowerCase()) || r;
}
const AYUDA_WIN = {
  "dir · ls · Get-ChildItem": "Lista archivos y carpetas", "cd · Set-Location": "Cambia de carpeta (cd .. sube)", "pwd · Get-Location": "Carpeta actual",
  "mkdir · md · New-Item -ItemType Directory": "Crea una carpeta", "New-Item archivo.txt": "Crea un archivo vacío", "echo texto > archivo.txt": "Guarda texto en un archivo (>> añade)",
  "type · cat · Get-Content": "Muestra un archivo", "copy · Copy-Item": "Copia", "move · Move-Item": "Mueve", "ren · Rename-Item": "Cambia el nombre",
  "del · rmdir /s · Remove-Item -Recurse": "Borra", "tree": "Árbol de carpetas", "cls · Clear-Host": "Limpia la pantalla",
  "ipconfig · ipconfig /all": "Tu configuración de red", "ping": "Comprueba si un equipo responde", "tracert": "Ruta hasta un equipo",
  "whoami · hostname": "Usuario y nombre del equipo", "tasklist · Get-Process": "Programas en marcha", "systeminfo": "Datos del sistema",
  "Get-Date · ver": "Fecha / versión", "history": "Comandos que has escrito", "reset": "Vuelve a empezar desde cero",
};
export function estadoWin(t) {
  if (!t.termWin?.fs) t.termWin = { fs: INICIO_WIN(), cwd: CASA_WIN, lineas: ["Windows PowerShell (simulado). Nada de lo que hagas aquí afecta a tu ordenador.", "Funcionan órdenes de CMD y de PowerShell. Escribe «help»."], hist: [] };
  return t.termWin;
}
const fechaWin = () => new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) + "  " + new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
function borrarWin(s, p, recursivo, nombreOrig) {
  if (!s.fs[p]) return [`No se encuentra la ruta de acceso '${aWin(p)}' porque no existe.`];
  if (p === "/" || p === "/Windows" || p === "/Users" || p === CASA_WIN) return ["Mejor no borres eso (en un Windows real te quedarías sin sistema)."];
  if (s.fs[p].t === "d" && hijos(s, p).length && !recursivo) return [`El directorio no está vacío: ${nombreOrig}. Usa rmdir /s o Remove-Item -Recurse.`];
  for (const k of Object.keys(s.fs)) if (k === p || k.startsWith(p + "/")) delete s.fs[k];
  return [];
}
export function ejecutarWin(s, linea) {
  const out = [];
  const redir = linea.match(/^(.*?)\s*(>>?)\s*(\S+)\s*$/);
  let cmd = linea, destino = null, anadir = false;
  if (redir && /^(echo|write-output)\b/i.test(redir[1].trim())) { cmd = redir[1]; destino = redir[3]; anadir = redir[2] === ">>"; }
  const partes = cmd.trim().match(/"[^"]*"|'[^']*'|\S+/g) || [];
  const args = partes.slice(1).map((a) => a.replace(/^["']|["']$/g, ""));
  const low = args.map((a) => a.toLowerCase());
  const opcion = (...n) => low.some((a) => n.includes(a));
  const valorDe = (n) => { const i = low.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const nom = args.filter((a, i) => !/^[-/]/.test(a) && !(i > 0 && /^-(itemtype|type|name|path|destination|newname|value)$/i.test(args[i - 1])));
  const o = (partes[0] || "").toLowerCase();
  switch (o) {
    case "": break;
    case "help": case "get-help": case "/?": out.push(...Object.entries(AYUDA_WIN).map(([k, v]) => `${k.padEnd(42)} ${v}`)); break;
    case "cls": case "clear": case "clear-host": s.lineas = []; return [];
    case "reset": Object.assign(s, { fs: INICIO_WIN(), cwd: CASA_WIN, lineas: [], hist: [], creoBasura: false, vioIp: false }); return ["Consola reiniciada."];
    case "history": case "get-history": case "h": out.push(...s.hist.map((h, i) => `${String(i + 1).padStart(4)} ${h}`)); break;
    case "whoami": out.push("pc-lorena\\lorena"); break;
    case "hostname": out.push("PC-LORENA"); break;
    case "ver": out.push("", "Microsoft Windows [Versión 10.0.22631] (simulado)"); break;
    case "get-date": case "date": case "time": out.push(new Date().toLocaleString("es-ES", { dateStyle: "full", timeStyle: "medium" })); break;
    case "pwd": case "get-location": case "gl": out.push("", "Path", "----", aWin(s.cwd), ""); break;
    case "cd": case "chdir": case "set-location": case "sl": {
      const a = nom[0] || valorDe("-path");
      if (!a) { out.push(aWin(s.cwd)); break; }
      const p = rutaWin(s, a);
      if (!s.fs[p]) out.push(`No se encuentra la ruta de acceso '${aWin(p)}' porque no existe.`);
      else if (s.fs[p].t !== "d") out.push("El nombre del directorio no es válido.");
      else s.cwd = p;
      break;
    }
    case "dir": case "ls": case "gci": case "get-childitem": {
      const p = rutaWin(s, nom[0] || valorDe("-path") || ".");
      if (!s.fs[p]) { out.push(`No se encuentra la ruta de acceso '${aWin(p)}' porque no existe.`); break; }
      const hs = s.fs[p].t === "d" ? hijos(s, p) : [p];
      out.push("", `    Directorio: ${aWin(p)}`, "", "Mode                 LastWriteTime         Length Name", "----                 -------------         ------ ----");
      for (const k of hs) { const x = s.fs[k]; out.push(`${x.t === "d" ? "d-----" : "-a----"}        ${fechaWin()}  ${x.t === "d" ? "      " : String(x.c?.length || 0).padStart(6)} ${k.split("/").pop()}`); }
      out.push("");
      break;
    }
    case "tree": {
      const p = rutaWin(s, nom[0] || ".");
      const pinta = (dir, pre) => { const hs = hijos(s, dir).filter((k) => s.fs[k].t === "d" || opcion("/f")); hs.forEach((k, i) => { const ult = i === hs.length - 1; out.push(`${pre}${ult ? "└───" : "├───"}${k.split("/").pop()}`); if (s.fs[k].t === "d") pinta(k, pre + (ult ? "    " : "│   ")); }); };
      out.push(aWin(p)); pinta(p, "");
      break;
    }
    case "mkdir": case "md": {
      if (!nom.length) { out.push("La sintaxis del comando no es correcta."); break; }
      for (const n of nom) {
        const p = rutaWin(s, n);
        if (s.fs[p]) { out.push(`Ya existe el subdirectorio o el archivo ${n}.`); continue; }
        let acc = ""; for (const tr of p.split("/").filter(Boolean)) { acc += "/" + tr; s.fs[acc] ||= { t: "d" }; }
        if (p.toLowerCase() === "/temp/basura") s.creoBasura = true;
      }
      break;
    }
    case "new-item": case "ni": {
      const tipo = (valorDe("-itemtype") || valorDe("-type") || "file").toLowerCase();
      const dir = valorDe("-path"); const n = valorDe("-name") || nom[0];
      if (!n && !dir) { out.push("Falta el nombre. Ejemplo: New-Item notas.txt  o  New-Item -ItemType Directory practicas"); break; }
      const p = rutaWin(s, dir && n && valorDe("-name") ? `${dir}/${n}` : (n || dir));
      if (s.fs[p]) { out.push(`New-Item: El elemento con el nombre especificado ${aWin(p)} ya existe.`); break; }
      if (!s.fs[padre(p)]) { out.push(`No se encuentra una parte de la ruta de acceso '${aWin(p)}'.`); break; }
      if (tipo.startsWith("dir")) { s.fs[p] = { t: "d" }; if (p.toLowerCase() === "/temp/basura") s.creoBasura = true; }
      else s.fs[p] = { t: "f", c: valorDe("-value") || "" };
      out.push("", `    Directorio: ${aWin(padre(p))}`, "", `${tipo.startsWith("dir") ? "d-----" : "-a----"}        ${fechaWin()}         ${p.split("/").pop()}`, "");
      break;
    }
    case "echo": case "write-output": case "write-host": {
      const texto = args.join(" ");
      if (!destino) { out.push(texto); break; }
      const p = rutaWin(s, destino);
      if (!s.fs[padre(p)]) { out.push("El sistema no puede encontrar la ruta especificada."); break; }
      s.fs[p] = { t: "f", c: (anadir && s.fs[p]?.c ? s.fs[p].c + "\n" : "") + texto };
      break;
    }
    case "set-content": case "add-content": case "sc": case "ac": {
      const n = valorDe("-path") || nom[0]; const v = valorDe("-value") ?? nom[1] ?? "";
      const p = rutaWin(s, n);
      if (!n || !s.fs[padre(p)]) { out.push("Ejemplo: Set-Content notas.txt \"hola\""); break; }
      s.fs[p] = { t: "f", c: (o.startsWith("a") && s.fs[p]?.c ? s.fs[p].c + "\n" : "") + v };
      break;
    }
    case "type": case "cat": case "gc": case "get-content": {
      for (const n of nom.length ? nom : [valorDe("-path")]) {
        const x = s.fs[rutaWin(s, n)];
        if (!x) out.push(`No se encuentra la ruta de acceso '${aWin(rutaWin(s, n))}' porque no existe.`);
        else if (x.t === "d") out.push("Acceso denegado: es una carpeta.");
        else out.push(...x.c.split("\n"));
      }
      break;
    }
    case "del": case "erase": case "rm": case "ri": case "remove-item": case "rmdir": case "rd": {
      if (!nom.length) { out.push("La sintaxis del comando no es correcta."); break; }
      const rec = opcion("/s", "-recurse", "-r") || o === "rm" && opcion("-rf");
      for (const n of nom) {
        const p = rutaWin(s, n);
        if (["del", "erase"].includes(o) && s.fs[p]?.t === "d") { out.push(`${n}: del borra archivos. Para carpetas usa rmdir /s ${n}`); continue; }
        out.push(...borrarWin(s, p, rec, n));
      }
      break;
    }
    case "copy": case "cp": case "copy-item": case "cpi": case "xcopy": case "move": case "mv": case "move-item": case "mi": {
      const a = nom[0] || valorDe("-path"), b = nom[1] || valorDe("-destination");
      if (!a || !b) { out.push("Falta el destino. Ejemplo: copy leeme.txt ..\\practicas"); break; }
      const or = rutaWin(s, a); let de = rutaWin(s, b);
      if (!s.fs[or]) { out.push(`No se encuentra la ruta de acceso '${aWin(or)}' porque no existe.`); break; }
      if (s.fs[de]?.t === "d") de = `${de === "/" ? "" : de}/${or.split("/").pop()}`;
      if (!s.fs[padre(de)]) { out.push("El sistema no puede encontrar la ruta especificada."); break; }
      const mover = o.startsWith("m");
      if (s.fs[or].t === "d" && !mover && !opcion("-recurse", "/e", "/s") && o !== "xcopy") { out.push("Para copiar carpetas usa Copy-Item -Recurse o xcopy /e"); break; }
      for (const k of Object.keys(s.fs)) if (k === or || k.startsWith(or + "/")) { s.fs[de + k.slice(or.length)] = { ...s.fs[k] }; if (mover) delete s.fs[k]; }
      if (!o.includes("item")) out.push(mover ? "        1 archivo(s) movido(s)." : "        1 archivo(s) copiado(s).");
      break;
    }
    case "ren": case "rename": case "rename-item": case "rni": {
      const a = nom[0] || valorDe("-path"), b = nom[1] || valorDe("-newname");
      const or = rutaWin(s, a || "");
      if (!a || !b || !s.fs[or]) { out.push("Ejemplo: ren viejo.txt nuevo.txt"); break; }
      const de = `${padre(or) === "/" ? "" : padre(or)}/${b}`;
      for (const k of Object.keys(s.fs)) if (k === or || k.startsWith(or + "/")) { s.fs[de + k.slice(or.length)] = s.fs[k]; delete s.fs[k]; }
      break;
    }
    case "ipconfig": {
      s.vioIp = true;
      out.push("", "Configuración IP de Windows", "", "Adaptador de Ethernet Ethernet:", "");
      if (opcion("/all")) out.push("   Descripción . . . . . . . . . . . : Intel(R) PRO/1000 MT", "   Dirección física. . . . . . . . . : 08-00-27-3A-1C-5E", "   DHCP habilitado . . . . . . . . . : sí");
      out.push("   Dirección IPv4. . . . . . . . . . : 192.168.1.37", "   Máscara de subred . . . . . . . . : 255.255.255.0", "   Puerta de enlace predeterminada . : 192.168.1.1");
      if (opcion("/all")) out.push("   Servidor DHCP . . . . . . . . . . : 192.168.1.1", "   Servidores DNS. . . . . . . . . . : 8.8.8.8", "                                       1.1.1.1");
      if (opcion("/release")) out.push("", "(Simulación) Se ha liberado la IP. En real te quedarías sin red hasta hacer ipconfig /renew.");
      if (opcion("/renew")) out.push("", "(Simulación) El servidor DHCP te ha vuelto a dar IP.");
      if (opcion("/flushdns")) out.push("", "Se vació correctamente la caché de resolución de DNS.");
      break;
    }
    case "ping": case "test-connection": {
      const h = nom[0];
      if (!h) { out.push("Uso: ping google.com"); break; }
      out.push("", `Haciendo ping a ${h} [142.250.184.14] con 32 bytes de datos:`);
      for (let i = 0; i < 4; i++) out.push(`Respuesta desde 142.250.184.14: bytes=32 tiempo=${Math.round(10 + Math.random() * 8)}ms TTL=117`);
      out.push("", `Estadísticas de ping para 142.250.184.14:`, "    Paquetes: enviados = 4, recibidos = 4, perdidos = 0 (0% perdidos)");
      break;
    }
    case "tracert": out.push(`Traza a ${nom[0] || "google.com"} sobre un máximo de 30 saltos`, "  1     1 ms     1 ms     1 ms  192.168.1.1", "  2     8 ms     7 ms     8 ms  10.20.0.1", "  3    12 ms    11 ms    12 ms  142.250.184.14", "", "Traza completa."); break;
    case "nslookup": out.push("Servidor:  dns.google", "Address:  8.8.8.8", "", "Respuesta no autoritativa:", `Nombre:  ${nom[0] || "google.com"}`, "Address:  142.250.184.14"); break;
    case "tasklist": case "get-process": case "ps":
      out.push("Nombre de imagen               PID   Uso de memoria", "========================= ======== ==============", "System                           4        144 KB", "explorer.exe                  4120     98.300 KB", "chrome.exe                    7788    312.004 KB", "Code.exe                      9012    201.556 KB"); break;
    case "systeminfo": out.push("Nombre de host:             PC-LORENA", "Nombre del sistema operativo: Microsoft Windows 11 Pro (simulado)", "Memoria física total:       16.384 MB", "Procesador(es):             1 procesador(es) instalado(s)."); break;
    case "sudo": out.push("En Windows no hay sudo: abre PowerShell «Como administrador»."); break;
    default: out.push(`'${partes[0]}' no se reconoce como un comando interno o externo, cmdlet o programa. Escribe «help».`);
  }
  return out;
}
const RETOS_WIN = [
  ["Entra en tu carpeta Documentos", (s) => s.cwd.toLowerCase() === "/users/lorena/documentos"],
  ["Crea la carpeta practicas en tu carpeta personal (C:\\Users\\lorena)", (s) => s.fs["/Users/lorena/practicas"]?.t === "d"],
  ["Crea notas.txt dentro de practicas con el texto «hola»", (s) => s.fs["/Users/lorena/practicas/notas.txt"]?.c?.trim() === "hola"],
  ["Copia leeme.txt a practicas", (s) => Boolean(s.fs["/Users/lorena/practicas/leeme.txt"])],
  ["Mira tu IP con ipconfig", (s) => Boolean(s.vioIp)],
  ["Crea C:\\Temp\\basura y después bórrala", (s) => s.creoBasura && !Object.keys(s.fs).some((k) => k.toLowerCase() === "/temp/basura")],
];

// ---------- Pintar una consola (Linux o Windows) ----------
export function estadoTerm(t, so = "linux") { return so === "windows" ? estadoWin(t) : estadoLinux(t); }
export const promptDe = (s, so) => (so === "windows" ? `PS ${aWin(s.cwd)}>` : `lorena@pc-lorena:${s.cwd.replace("/home/lorena", "~")}$`);
export function htmlConsola(e, so = "linux") {
  const t = (e.herr ||= {});
  const s = estadoTerm(t, so);
  const pre = t.termPre?.[so] || "";
  return `<div class="terminal ${so === "windows" ? "ps" : ""}" id="terminal">
      <pre>${s.lineas.map(esc).join("\n")}</pre>
      <form data-form="herr-term" data-so="${so}" class="term-linea" autocomplete="off"><span class="mono">${esc(promptDe(s, so))}</span>
        <input id="termIn" name="cmd" class="mono" value="${esc(pre)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Comando"></form>
    </div>`;
}
export function htmlRetos(e, so = "linux") {
  const s = estadoTerm(e.herr ||= {}, so);
  const lista = so === "windows" ? RETOS_WIN : RETOS;
  const hechos = lista.filter(([, ok]) => ok(s)).length;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("bandera")} Retos</h2><span class="chip ${hechos === lista.length ? "ok" : ""}">${hechos}/${lista.length}</span></div>
    <ul class="checklist">${lista.map(([txt, ok]) => `<li><label><input type="checkbox" disabled ${ok(s) ? "checked" : ""}> <span>${esc(txt)}</span></label></li>`).join("")}</ul>
  </section>`;
}
// Ejecuta una línea en la consola indicada y la apunta en pantalla
export function ejecutarEn(t, so, linea) {
  const s = estadoTerm(t, so);
  const prompt = `${promptDe(s, so)} ${linea}`;
  if (linea.trim()) s.hist.push(linea);
  const out = so === "windows" ? ejecutarWin(s, linea) : ejecutarTerm(s, linea);
  if (!["clear", "cls", "clear-host"].includes(linea.trim().toLowerCase())) s.lineas.push(prompt, ...out);
  s.lineas = s.lineas.slice(-200);
  s.hist = s.hist.slice(-100);
}
