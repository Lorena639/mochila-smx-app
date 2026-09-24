// =============================================================
//  sb-git.js — Git DE VERDAD en el navegador (isomorphic-git)
//  Los repositorios se guardan en este dispositivo (IndexedDB).
//  Incluye una mini terminal con ls, cd, cat, echo, nano…
// =============================================================
import { cargarScript, crearTerminal, EditorLinea } from "./sb-terminal.js";

const GIT = "https://cdn.jsdelivr.net/npm/isomorphic-git@1.42.2/";
const LFS = "https://cdn.jsdelivr.net/npm/@isomorphic-git/lightning-fs@4.9.0/dist/lightning-fs.min.js";
const PROXY = "https://cors.isomorphic-git.org";
const BUFFER = "https://cdn.jsdelivr.net/npm/buffer@6.0.3/+esm"; // isomorphic-git necesita Buffer
const C = { r: "\x1b[31m", v: "\x1b[32m", a: "\x1b[33m", c: "\x1b[36m", b: "\x1b[1m", n: "\x1b[0m", az: "\x1b[1;34m" };

const unir = (a, b) => (b.startsWith("/") ? b : (a === "/" ? "" : a) + "/" + b);
function normal(p) {
  const r = [];
  for (const x of p.split("/")) { if (!x || x === ".") continue; if (x === "..") r.pop(); else r.push(x); }
  return "/" + r.join("/");
}
const fechaGit = (seg, tz) => {
  const d = new Date(seg * 1000);
  const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], meses = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const off = -(tz ?? d.getTimezoneOffset()); const s = off >= 0 ? "+" : "-";
  return `${dias[d.getDay()]} ${meses[d.getMonth()]} ${d.getDate()} ${d.toTimeString().slice(0, 8)} ${d.getFullYear()} ${s}${String(Math.floor(Math.abs(off) / 60)).padStart(2, "0")}${String(Math.abs(off) % 60).padStart(2, "0")}`;
};
// Diferencias línea a línea (LCS), como git diff
function diffLineas(a, b) {
  const A = a === "" ? [] : a.split("\n"), B = b === "" ? [] : b.split("\n");
  const n = A.length, m = B.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const r = []; let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j]) { r.push(" " + A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) r.push("-" + A[i++]); else r.push("+" + B[j++]); }
  while (i < n) r.push("-" + A[i++]); while (j < m) r.push("+" + B[j++]);
  return { lineas: r, n, m };
}

export const git = {
  t: null, ed: null, fs: null, pfs: null, cwd: "/", listo: false, editando: null,
  autor: { name: "Lorena", email: "lorena@ejemplo.com" },

  async iniciar() {
    if (this.t) return;
    this.t = crearTerminal("git");
    const term = this.t.term;
    this.ed = new EditorLinea(term, { prompt: () => this.prompt(), alEnter: (l) => this.ejecutar(l), completar: (a) => this.completar(a) });
    term.onData((d) => { if (!this.editando) this.ed.datos(d); });
    term.write("Cargando git…\r\n");
    try {
      if (!window.Buffer) window.Buffer = (await import(BUFFER)).Buffer;
      await cargarScript(LFS);
      await cargarScript(GIT + "index.umd.min.js");
      await cargarScript(GIT + "http/web/index.umd.js");
      this.fs = new window.LightningFS("mochila-git");
      this.pfs = this.fs.promises;
      try { const c = JSON.parse(localStorage.getItem("mochila-sb-git") || "null"); if (c?.autor) this.autor = c.autor; if (c?.cwd) this.cwd = c.cwd; await this.pfs.stat(this.cwd); } catch { this.cwd = "/"; }
      this.listo = true;
      term.write("\x1b[2K\r\x1b[1A\x1b[2K\r");
      term.write(`${C.b}git version 2.46.0 (isomorphic-git ${window.git.version()})${C.n}\r\nEs git de verdad: los commits, ramas y archivos se guardan en este dispositivo.\r\nEscribe ${C.a}help${C.n} para ver lo que puedes hacer.\r\n\r\n`);
      this.ed.escribirPrompt();
    } catch (e) {
      term.write(`${C.r}${e.message}${C.n}\r\n`);
      this.t = null; // se podrá reintentar
    }
  },
  guardar() { try { localStorage.setItem("mochila-sb-git", JSON.stringify({ autor: this.autor, cwd: this.cwd })); } catch { /* nada */ } },
  enviar(d) { this.ed?.datos(d); },
  async reiniciar() {
    this.fs = new window.LightningFS("mochila-git", { wipe: true }); this.pfs = this.fs.promises; this.cwd = "/"; this.guardar();
    this.t.term.reset(); this.t.term.write("Todo borrado. Empiezas de cero.\r\n"); this.ed.escribirPrompt();
  },

  rama: "",
  prompt() {
    const casa = this.cwd === "/" ? "~" : "~" + this.cwd;
    return `${C.v}\x1b[1mlorena@pc-lorena${C.n}:${C.az}${casa}${C.n}${this.rama ? ` ${C.c}(${this.rama})${C.n}` : ""}$ `;
  },
  // Busca la carpeta del repositorio (la que tiene .git) desde donde estás
  async raiz(desde = this.cwd) {
    let d = desde;
    for (;;) {
      try { await this.pfs.stat(unir(d, ".git")); return d; } catch { /* sube */ }
      if (d === "/") return null;
      d = d.slice(0, d.lastIndexOf("/")) || "/";
    }
  },
  async actualizarRama() {
    const dir = await this.raiz();
    this.rama = dir ? (await window.git.currentBranch({ fs: this.fs, dir, fullname: false }).catch(() => null)) || "HEAD" : "";
  },
  async existe(p) { try { return await this.pfs.stat(p); } catch { return null; } },
  async listar(dir) { return (await this.pfs.readdir(dir)).sort((a, b) => a.localeCompare(b)); },
  async completar(antes) {
    const m = antes.match(/(\S*)$/); const trozo = m[1];
    const barra = trozo.lastIndexOf("/");
    const dir = normal(unir(this.cwd, barra >= 0 ? trozo.slice(0, barra + 1) : "."));
    const pref = trozo.slice(barra + 1);
    let lista = [];
    if (!antes.includes(" ")) lista = ["git", "ls", "cd", "pwd", "cat", "echo", "mkdir", "touch", "rm", "mv", "nano", "clear", "help", "tree"].filter((x) => x.startsWith(pref));
    else if (/^git \S*$/.test(antes)) lista = ["init", "status", "add", "commit", "log", "diff", "branch", "switch", "checkout", "merge", "restore", "rm", "reset", "config", "clone", "tag", "show", "remote"].filter((x) => x.startsWith(pref));
    else { try { lista = (await this.listar(dir)).filter((x) => x.startsWith(pref) && x !== ".git"); } catch { /* nada */ } }
    if (lista.length === 1) { const st = await this.existe(unir(dir, lista[0])); return { texto: lista[0].slice(pref.length) + (st?.isDirectory() ? "/" : " ") }; }
    if (lista.length > 1) return { opciones: lista };
    return null;
  },

  async ejecutar(linea) {
    if (!this.listo) return;
    const term = this.t.term;
    const out = (s = "") => term.write(String(s).replace(/\r?\n/g, "\r\n") + "\r\n");
    const redir = linea.match(/^\s*echo\s+(.*?)\s*(>>?)\s*(\S+)\s*$/);
    const partes = (redir ? [] : linea.trim().match(/"[^"]*"|'[^']*'|\S+/g)) || [];
    const args = partes.slice(1).map((a) => a.replace(/^["']|["']$/g, ""));
    const ruta = (p) => normal(unir(this.cwd, p || "."));
    try {
      if (redir) {
        const texto = redir[1].replace(/^["']|["']$/g, "");
        const p = ruta(redir[3]);
        let previo = "";
        if (redir[2] === ">>") previo = await this.pfs.readFile(p, "utf8").catch(() => "");
        await this.pfs.writeFile(p, previo + texto + "\n", "utf8");
        return;
      }
      switch (partes[0]) {
        case undefined: return;
        case "help": return out([
          `${C.b}Archivos${C.n}: ls, cd, pwd, mkdir, touch, cat, echo texto > archivo, nano archivo, rm [-r], mv, tree, clear`,
          `${C.b}Git${C.n}:`,
          "  git init                    crea un repositorio en esta carpeta",
          "  git status                  qué ha cambiado",
          "  git add <archivo> | .       prepara cambios para el commit",
          "  git commit -m \"mensaje\"     guarda una foto de los cambios (-am: add + commit)",
          "  git log [--oneline]         historial de commits",
          "  git diff [--staged]         qué líneas han cambiado",
          "  git branch [nombre] [-d]    ver, crear o borrar ramas",
          "  git switch [-c] <rama>      cambiar de rama (-c la crea); también git checkout [-b]",
          "  git merge <rama>            unir otra rama a la actual",
          "  git restore [--staged] <f>  deshacer cambios / sacar del stage",
          "  git reset --hard            volver al último commit (¡borra los cambios!)",
          "  git tag <nombre>            ponerle nombre a un commit",
          "  git show [commit]           ver un commit",
          "  git config user.name \"X\"    tu nombre para los commits",
          "  git clone <url-de-github>   descargar un repo público de GitHub",
          "  reset-todo                  borra todo el sandbox de git",
        ].join("\n"));
        case "clear": term.clear(); term.write("\x1b[2J\x1b[H"); return;
        case "pwd": return out(this.cwd === "/" ? "/home/lorena" : "/home/lorena" + this.cwd);
        case "cd": {
          const p = !args[0] || args[0] === "~" ? "/" : ruta(args[0].replace(/^~\//, "/"));
          const st = await this.existe(p);
          if (!st) return out(`bash: cd: ${args[0]}: No existe el archivo o el directorio`);
          if (!st.isDirectory()) return out(`bash: cd: ${args[0]}: No es un directorio`);
          this.cwd = p; this.guardar(); await this.actualizarRama(); return;
        }
        case "ls": {
          const todos = args.some((a) => /^-\w*a/.test(a));
          const largo = args.some((a) => /^-\w*l/.test(a));
          const p = ruta(args.find((a) => !a.startsWith("-")));
          const st = await this.existe(p);
          if (!st) return out(`ls: no se puede acceder a '${args.find((a) => !a.startsWith("-"))}': No existe el archivo o el directorio`);
          if (!st.isDirectory()) return out(p.split("/").pop());
          const nombres = (await this.listar(p)).filter((n) => todos || !n.startsWith("."));
          const info = await Promise.all(nombres.map(async (n) => ({ n, st: await this.pfs.stat(unir(p, n)) })));
          if (largo) return out([`total ${info.length}`, ...info.map(({ n, st: s }) => `${s.isDirectory() ? "drwxr-xr-x" : "-rw-r--r--"} 1 lorena lorena ${String(s.size || 4096).padStart(5)} ${new Date(s.mtimeMs).toLocaleDateString("es-ES", { month: "short", day: "2-digit" })} ${s.isDirectory() ? C.az + n + C.n : n}`)].join("\n"));
          return out(info.map(({ n, st: s }) => (s.isDirectory() ? C.az + n + C.n : n)).join("  "));
        }
        case "tree": {
          const r = ["."];
          const pinta = async (d, pre) => { const hs = (await this.listar(d)).filter((n) => n !== ".git"); for (let i = 0; i < hs.length; i++) { const ult = i === hs.length - 1; const st = await this.pfs.stat(unir(d, hs[i])); r.push(`${pre}${ult ? "└── " : "├── "}${st.isDirectory() ? C.az + hs[i] + C.n : hs[i]}`); if (st.isDirectory()) await pinta(unir(d, hs[i]), pre + (ult ? "    " : "│   ")); } };
          await pinta(this.cwd, ""); return out(r.join("\n"));
        }
        case "mkdir": for (const a of args.filter((x) => !x.startsWith("-"))) {
          const p = ruta(a);
          if (await this.existe(p)) { out(`mkdir: no se puede crear el directorio «${a}»: El archivo ya existe`); continue; }
          if (args.includes("-p")) { let acc = ""; for (const tr of p.split("/").filter(Boolean)) { acc += "/" + tr; if (!(await this.existe(acc))) await this.pfs.mkdir(acc); } }
          else { try { await this.pfs.mkdir(p); } catch { out(`mkdir: no se puede crear el directorio «${a}»: No existe el archivo o el directorio`); } }
        } return;
        case "touch": for (const a of args) { const p = ruta(a); if (!(await this.existe(p))) await this.pfs.writeFile(p, "", "utf8"); } return;
        case "cat": for (const a of args) { const p = ruta(a); const st = await this.existe(p); if (!st) out(`cat: ${a}: No existe el archivo o el directorio`); else if (st.isDirectory()) out(`cat: ${a}: Es un directorio`); else term.write((await this.pfs.readFile(p, "utf8")).replace(/\n/g, "\r\n")); } return;
        case "echo": return out(args.join(" "));
        case "rm": {
          const rec = args.some((a) => /^-\w*r/.test(a));
          for (const a of args.filter((x) => !x.startsWith("-"))) {
            const p = ruta(a); const st = await this.existe(p);
            if (!st) { out(`rm: no se puede borrar '${a}': No existe el archivo o el directorio`); continue; }
            if (st.isDirectory() && !rec) { out(`rm: no se puede borrar '${a}': Es un directorio`); continue; }
            await this.borrar(p);
          }
          if (!(await this.existe(this.cwd))) this.cwd = "/";
          await this.actualizarRama(); return;
        }
        case "mv": {
          if (args.length < 2) return out("mv: falta el archivo de destino");
          const o = ruta(args[0]); let d = ruta(args[1]);
          if (!(await this.existe(o))) return out(`mv: no se puede efectuar 'stat' sobre '${args[0]}': No existe el archivo o el directorio`);
          if ((await this.existe(d))?.isDirectory()) d = unir(d, o.split("/").pop());
          await this.pfs.rename(o, d); return;
        }
        case "nano": case "vi": case "vim": case "code": case "edit": {
          if (!args[0]) return out(`Uso: ${partes[0]} archivo.txt`);
          return this.abrirEditor(ruta(args[0]), args[0]);
        }
        case "reset-todo": return this.reiniciar();
        case "git": await this.orden(args, out); await this.actualizarRama(); return;
        default: return out(`${partes[0]}: orden no encontrada. Escribe help.`);
      }
    } catch (e) {
      out(`${C.r}error: ${e.message}${C.n}`);
    }
  },
  async borrar(p) {
    const st = await this.pfs.stat(p);
    if (st.isDirectory()) { for (const n of await this.pfs.readdir(p)) await this.borrar(unir(p, n)); await this.pfs.rmdir(p); }
    else await this.pfs.unlink(p);
  },

  // ---------- Órdenes de git ----------
  async orden(args, out) {
    const g = window.git, fs = this.fs;
    const [sub, ...r] = args;
    const opt = (...n) => r.some((x) => n.includes(x));
    const libres = r.filter((x, i) => !x.startsWith("-") && !(i > 0 && ["-m", "-am", "-n", "-c", "-b", "-d", "-D"].includes(r[i - 1])));
    const author = this.autor;
    if (!sub || sub === "help" || sub === "--help") return this.ejecutar("help");
    if (sub === "--version" || sub === "version") return out(`git version 2.46.0 (isomorphic-git ${g.version()})`);
    if (sub === "config") {
      const k = r.find((x) => !x.startsWith("--")); const v = r.slice(r.indexOf(k) + 1).join(" ");
      if (k === "user.name") { if (v) this.autor.name = v; else return out(this.autor.name); }
      else if (k === "user.email") { if (v) this.autor.email = v; else return out(this.autor.email); }
      else if (r.includes("--list") || r.includes("-l")) return out(`user.name=${this.autor.name}\nuser.email=${this.autor.email}\ninit.defaultbranch=main`);
      else return out("Aquí se puede configurar user.name y user.email.");
      this.guardar(); return;
    }
    if (sub === "init") {
      const dir = this.cwd;
      const ya = await this.existe(unir(dir, ".git"));
      await g.init({ fs, dir, defaultBranch: "main" });
      return out(ya ? `Reinicializado el repositorio Git existente en /home/lorena${dir === "/" ? "" : dir}/.git/` : `Inicializado repositorio Git vacío en /home/lorena${dir === "/" ? "" : dir}/.git/`);
    }
    if (sub === "clone") {
      const url = libres[0];
      if (!url) return out("uso: git clone <url>   (ejemplo: git clone https://github.com/octocat/Hello-World)");
      const nombre = libres[1] || url.replace(/\.git$/, "").split("/").pop();
      const dir = normal(unir(this.cwd, nombre));
      if (await this.existe(dir)) return out(`fatal: la ruta de destino '${nombre}' ya existe y no es un directorio vacío.`);
      out(`Clonando en '${nombre}'...`);
      try {
        await g.clone({ fs, http: window.GitHttp, dir, url, corsProxy: PROXY, singleBranch: true, depth: 20,
          onProgress: (p) => { if (p.total) this.t.term.write(`\r${p.phase}: ${Math.round((p.loaded / p.total) * 100)}% (${p.loaded}/${p.total})\x1b[K`); } });
        this.t.term.write("\r\x1b[K"); return out("hecho.");
      } catch (e) {
        await this.borrar(dir).catch(() => {});
        return out(`${C.r}fatal: no se ha podido clonar (${e.message}). Tiene que ser un repositorio público de GitHub y hace falta internet.${C.n}`);
      }
    }
    const dir = await this.raiz();
    if (!dir) return out("fatal: no es un repositorio git (ni ninguno de los directorios superiores): .git\nPista: escribe git init dentro de una carpeta.");
    const rel = (p) => normal(unir(this.cwd, p)).slice(dir === "/" ? 1 : dir.length + 1);
    const rama = await g.currentBranch({ fs, dir }).catch(() => null);
    const hayCommits = async () => { try { await g.resolveRef({ fs, dir, ref: "HEAD" }); return true; } catch { return false; } };
    const matriz = async () => (await g.statusMatrix({ fs, dir })).filter(([f]) => !f.startsWith(".git/"));
    switch (sub) {
      case "status": {
        const m = await matriz();
        const staged = [], cambios = [], nuevos = [];
        for (const [f, h, w, s] of m) {
          if (h === 0 && w === 2 && s === 0) { nuevos.push(f); continue; }
          if (h === 1 && s === 0) staged.push(["borrado:", f]);
          else if (h === 0 && s >= 2) staged.push(["nuevo archivo:", f]);
          else if (h === 1 && (s === 2 || s === 3)) staged.push(["modificado:", f]);
          if (w === 0 && s !== 0) cambios.push(["borrado:", f]);
          else if (s === 3 || (s === 1 && w === 2)) cambios.push(["modificado:", f]);
          if (h === 1 && s === 0 && w === 2) nuevos.push(f);
        }
        if (opt("-s", "--short")) {
          return out(m.filter(([, h, w, s]) => !(h === 1 && w === 1 && s === 1)).map(([f, h, w, s]) => {
            const x = h === 0 && s === 0 ? "?" : h === 1 && s === 0 ? "D" : h === 0 && s >= 2 ? "A" : h === 1 && s >= 2 ? "M" : " ";
            const y = h === 0 && s === 0 ? "?" : w === 0 && s !== 0 ? "D" : s === 3 || (s === 1 && w === 2) ? "M" : " ";
            return `${C.v}${x}${C.n}${C.r}${y}${C.n} ${f}`;
          }).join("\n"));
        }
        const l = [`En la rama ${rama || "(HEAD desacoplado)"}`];
        if (!(await hayCommits())) l.push("", "No hay commits todavía");
        if (staged.length) l.push("", "Cambios a ser confirmados:", '  (usa "git restore --staged <archivo>..." para sacar del área de stage)', ...staged.map(([t, f]) => `\t${C.v}${t.padEnd(15)}${f}${C.n}`));
        if (cambios.length) l.push("", "Cambios no rastreados para el commit:", '  (usa "git add <archivo>..." para actualizar lo que será confirmado)', '  (usa "git restore <archivo>..." para descartar los cambios en el directorio de trabajo)', ...cambios.map(([t, f]) => `\t${C.r}${t.padEnd(15)}${f}${C.n}`));
        if (nuevos.length) l.push("", "Archivos sin seguimiento:", '  (usa "git add <archivo>..." para incluirlo a lo que será confirmado)', ...nuevos.map((f) => `\t${C.r}${f}${C.n}`));
        if (!staged.length && !cambios.length && !nuevos.length) l.push((await hayCommits()) ? "nada para hacer commit, el árbol de trabajo está limpio" : "\nnada para hacer commit (crea/copia archivos y usa \"git add\" para hacerles seguimiento)");
        else if (!staged.length) l.push("", 'no hay cambios agregados al commit (usa "git add" y/o "git commit -a")');
        return out(l.join("\n"));
      }
      case "add": {
        if (!libres.length && !opt("-A", "--all")) return out("Nada especificado, nada agregado.\nhint: ¿Quizás quisiste decir 'git add .'?");
        const m = await matriz();
        const todo = opt("-A", "--all") || libres.includes(".") || libres.includes("*");
        const quiere = todo ? null : libres.map(rel);
        let alguno = false;
        for (const [f, , w] of m) {
          if (quiere && !quiere.some((q) => f === q || f.startsWith(q + "/") || q === "")) continue;
          alguno = true;
          if (w === 0) await g.remove({ fs, dir, filepath: f }); else await g.add({ fs, dir, filepath: f });
        }
        if (!alguno && quiere) return out(`fatal: ruta especificada '${libres[0]}' no concordó con ningún archivo`);
        return;
      }
      case "rm": {
        for (const a of libres) {
          const f = rel(a);
          await g.remove({ fs, dir, filepath: f });
          if (!opt("--cached")) await this.pfs.unlink(unir(dir, f)).catch(() => {});
          out(`rm '${f}'`);
        }
        return;
      }
      case "commit": {
        let msg = null;
        for (let i = 0; i < r.length; i++) if (["-m", "-am", "-a"].includes(r[i]) && r[i] !== "-a") msg = r[i + 1];
        if (opt("-a", "-am")) for (const [f, h, w, s] of await matriz()) { if (h === 1 && w === 0) await g.remove({ fs, dir, filepath: f }); else if (h === 1 && w === 2 && s !== 2) await g.add({ fs, dir, filepath: f }); }
        if (!msg) return out('Falta el mensaje. Usa: git commit -m "lo que has cambiado"\n(En un git normal se abriría un editor para escribirlo.)');
        const m = await matriz();
        const cambios = m.filter(([, h, , s]) => !(h === 1 && s === 1) && !(h === 0 && s === 0));
        if (!cambios.length) return out(`En la rama ${rama}\nnada para hacer commit, el árbol de trabajo está limpio\n(¿Te falta git add?)`);
        const primero = !(await hayCommits());
        const oid = await g.commit({ fs, dir, message: msg, author });
        const nuevos = cambios.filter(([, h]) => h === 0).length, borrados = cambios.filter(([, , , s]) => s === 0).length;
        return out(`[${rama}${primero ? " (commit-raíz)" : ""} ${oid.slice(0, 7)}] ${msg}\n ${cambios.length} archivo${cambios.length === 1 ? "" : "s"} cambiado${cambios.length === 1 ? "" : "s"}` +
          cambios.filter(([, h]) => h === 0).map(([f]) => `\n create mode 100644 ${f}`).join("") + cambios.filter(([, , , s]) => s === 0).map(([f]) => `\n delete mode 100644 ${f}`).join("") + (nuevos || borrados ? "" : ""));
      }
      case "log": {
        if (!(await hayCommits())) return out(`fatal: tu rama actual '${rama}' no tiene ningún commit todavía`);
        const nIdx = r.findIndex((x) => x === "-n" || /^-\d+$/.test(x));
        const depth = nIdx >= 0 ? Number(r[nIdx] === "-n" ? r[nIdx + 1] : r[nIdx].slice(1)) : undefined;
        const commits = await g.log({ fs, dir, depth, ref: libres[0] || "HEAD" });
        const ramas = await g.listBranches({ fs, dir }); const puntas = {};
        for (const b of ramas) { const o = await g.resolveRef({ fs, dir, ref: b }); (puntas[o] ||= []).push(b === rama ? `${C.c}\x1b[1mHEAD -> ${C.v}${b}${C.n}` : `${C.v}${b}${C.n}`); }
        const tags = await g.listTags({ fs, dir }); for (const t of tags) { const o = await g.resolveRef({ fs, dir, ref: t }); (puntas[o] ||= []).push(`${C.a}tag: ${t}${C.n}`); }
        const deco = (oid) => (puntas[oid] ? ` ${C.a}(${C.n}${puntas[oid].join(`${C.a}, ${C.n}`)}${C.a})${C.n}` : "");
        if (opt("--oneline")) return out(commits.map((c) => `${C.a}${c.oid.slice(0, 7)}${C.n}${deco(c.oid)} ${c.commit.message.split("\n")[0]}`).join("\n"));
        return out(commits.map((c) => `${C.a}commit ${c.oid}${C.n}${deco(c.oid)}${c.commit.parent.length > 1 ? `\nMerge: ${c.commit.parent.map((p) => p.slice(0, 7)).join(" ")}` : ""}\nAuthor: ${c.commit.author.name} <${c.commit.author.email}>\nDate:   ${fechaGit(c.commit.author.timestamp, c.commit.author.timezoneOffset)}\n\n    ${c.commit.message.trim().split("\n").join("\n    ")}\n`).join("\n"));
      }
      case "diff": {
        const staged = opt("--staged", "--cached");
        const leer = async (tree, f) => { try { return tree === "WORK" ? await this.pfs.readFile(unir(dir, f), "utf8") : new TextDecoder().decode((await g.readBlob({ fs, dir, oid: await g.resolveRef({ fs, dir, ref: "HEAD" }), filepath: f })).blob); } catch { return null; } };
        const leerIndice = async (f) => {
          const r2 = await g.walk({ fs, dir, trees: [g.STAGE()], map: async (fp, [e]) => (fp === f && e ? new TextDecoder().decode(await e.content() || new Uint8Array()) : undefined) });
          return r2.find((x) => x !== undefined) ?? null;
        };
        const l = [];
        for (const [f, h, w, s] of await matriz()) {
          let antes, despues;
          if (staged) { if ((h === 1 && s === 1) || (h === 0 && s === 0)) continue; antes = h ? await leer("HEAD", f) : null; despues = s ? await leerIndice(f) : null; }
          else { if (!(s === 3 || (s === 1 && w === 2) || (w === 0 && s !== 0))) continue; antes = await leerIndice(f); despues = w ? await leer("WORK", f) : null; }
          const d = diffLineas((antes ?? "").replace(/\n$/, ""), (despues ?? "").replace(/\n$/, ""));
          l.push(`${C.b}diff --git a/${f} b/${f}${C.n}`);
          if (antes === null) l.push(`${C.b}new file mode 100644${C.n}`); if (despues === null) l.push(`${C.b}deleted file mode 100644${C.n}`);
          l.push(`${C.b}--- ${antes === null ? "/dev/null" : "a/" + f}${C.n}`, `${C.b}+++ ${despues === null ? "/dev/null" : "b/" + f}${C.n}`, `${C.c}@@ -1,${d.n} +1,${d.m} @@${C.n}`);
          l.push(...d.lineas.map((x) => (x[0] === "+" ? C.v + x + C.n : x[0] === "-" ? C.r + x + C.n : x)));
        }
        return l.length ? out(l.join("\n")) : undefined;
      }
      case "branch": {
        if (opt("-d", "-D")) {
          const n = r[r.findIndex((x) => x === "-d" || x === "-D") + 1];
          if (n === rama) return out(`error: no se puede borrar la rama '${n}' que está activa`);
          await g.deleteBranch({ fs, dir, ref: n }); return out(`Eliminada la rama ${n}.`);
        }
        if (libres[0]) {
          if (!(await hayCommits())) return out(`fatal: no es un nombre de objeto válido: '${rama}'. (Haz primero un commit)`);
          await g.branch({ fs, dir, ref: libres[0] }); return;
        }
        return out((await g.listBranches({ fs, dir })).sort().map((b) => (b === rama ? `* ${C.v}${b}${C.n}` : `  ${b}`)).join("\n"));
      }
      case "switch": case "checkout": {
        const crear = opt("-c", "-b");
        if (sub === "checkout" && libres.length && !crear && (await this.existe(normal(unir(this.cwd, libres[0])))) && !(await g.listBranches({ fs, dir })).includes(libres[0])) {
          // git checkout -- archivo (descartar cambios)
          await g.checkout({ fs, dir, force: true, filepaths: libres.map(rel) }); return out(`Actualizada ${libres.length} ruta${libres.length === 1 ? "" : "s"} desde el índice`);
        }
        const n = crear ? r[r.findIndex((x) => x === "-c" || x === "-b") + 1] : libres[0];
        if (!n) return out("fatal: falta el nombre de la rama");
        if (crear) {
          if (!(await hayCommits())) { await g.writeRef({ fs, dir, ref: "HEAD", value: `refs/heads/${n}`, symbolic: true, force: true }); return out(`Cambiado a nueva rama '${n}'`); }
          await g.branch({ fs, dir, ref: n, checkout: true }); return out(`Cambiado a nueva rama '${n}'`);
        }
        if (!(await g.listBranches({ fs, dir })).includes(n)) return out(`fatal: referencia no válida: ${n}`);
        const sucios = (await matriz()).filter(([, h, w, s]) => h === 1 && (w !== 1 || s !== 1));
        if (sucios.length) return out(`error: Los cambios locales de los siguientes archivos serán sobrescritos al hacer checkout:\n${sucios.map(([f]) => "\t" + f).join("\n")}\nPor favor, confirma tus cambios o guárdalos antes de cambiar de rama.\nAbortando`);
        await g.checkout({ fs, dir, ref: n }); return out(`Cambiado a rama '${n}'`);
      }
      case "merge": {
        const n = libres[0];
        if (!n) return out("fatal: falta la rama que quieres unir");
        const antes = await g.resolveRef({ fs, dir, ref: "HEAD" });
        try {
          const res = await g.merge({ fs, dir, ours: rama, theirs: n, author, message: `Merge branch '${n}'`, abortOnConflict: false });
          if (res.alreadyMerged) return out("Ya está actualizado.");
          await g.checkout({ fs, dir, ref: rama });
          if (res.fastForward) return out(`Actualizando ${antes.slice(0, 7)}..${res.oid.slice(0, 7)}\nFast-forward`);
          return out(`Merge made by the 'ort' strategy.`);
        } catch (e) {
          if (e.code === "MergeConflictError" || e.code === "MergeNotSupportedError") {
            const fich = e.data?.filepaths || [];
            return out(`${fich.map((f) => `Auto-fusionando ${f}\nCONFLICTO (contenido): Conflicto de fusión en ${f}`).join("\n")}\nFusión automática falló; arregla los conflictos (edita con nano, quita las marcas <<<<<<< ======= >>>>>>>)\ny luego haz git add y git commit.`);
          }
          throw e;
        }
      }
      case "restore": {
        const fich = libres.map(rel);
        if (opt("--staged")) { for (const f of fich) await g.resetIndex({ fs, dir, filepath: f }); return; }
        await g.checkout({ fs, dir, force: true, filepaths: fich }); return;
      }
      case "reset": {
        if (opt("--hard")) {
          const oid = await g.resolveRef({ fs, dir, ref: "HEAD" });
          for (const [f, h] of await matriz()) { if (h === 0) { await g.remove({ fs, dir, filepath: f }).catch(() => {}); } }
          await g.checkout({ fs, dir, ref: rama, force: true });
          const c = (await g.log({ fs, dir, depth: 1 }))[0];
          return out(`HEAD está ahora en ${oid.slice(0, 7)} ${c.commit.message.split("\n")[0]}`);
        }
        for (const [f] of await matriz()) await g.resetIndex({ fs, dir, filepath: f });
        return out("Cambios fuera del área de stage tras el reset.");
      }
      case "tag": {
        if (!libres[0]) return out((await g.listTags({ fs, dir })).join("\n"));
        await g.tag({ fs, dir, ref: libres[0] }); return;
      }
      case "show": {
        const c = (await g.log({ fs, dir, depth: 1, ref: libres[0] || "HEAD" }))[0];
        return out(`${C.a}commit ${c.oid}${C.n}\nAuthor: ${c.commit.author.name} <${c.commit.author.email}>\nDate:   ${fechaGit(c.commit.author.timestamp, c.commit.author.timezoneOffset)}\n\n    ${c.commit.message.trim()}\n`);
      }
      case "remote": {
        if (r[0] === "add" && r[1] && r[2]) { await g.addRemote({ fs, dir, remote: r[1], url: r[2] }); return; }
        const rs = await g.listRemotes({ fs, dir });
        return out(rs.map((x) => (opt("-v") ? `${x.remote}\t${x.url} (fetch)\n${x.remote}\t${x.url} (push)` : x.remote)).join("\n"));
      }
      case "push": case "pull": case "fetch":
        return out(`${C.a}En este sandbox no se sube ni se baja nada de GitHub (haría falta tu token y no queremos arriesgarlo).${C.n}\nEn tu PC de verdad sería: git ${sub} origin ${rama || "main"}`);
      default: return out(`git: '${sub}' no es un comando de git. Mira 'git help'.`);
    }
  },

  // ---------- nano (editor sencillo) ----------
  async abrirEditor(p, nombre) {
    const st = await this.existe(p);
    if (st?.isDirectory()) { this.t.term.write(`${nombre}: es un directorio\r\n`); return; }
    const texto = st ? await this.pfs.readFile(p, "utf8") : "";
    this.editando = { p, nombre, texto };
    this.alEditar?.();
    await new Promise((ok) => { this.editando.fin = ok; });
  },
  async guardarSinSalir(nuevo) {
    const e = this.editando; if (!e) return;
    await this.pfs.writeFile(e.p, nuevo.endsWith("\n") || !nuevo ? nuevo : nuevo + "\n", "utf8");
    e.texto = nuevo;
    const pie = document.querySelector(".sb-nano-cab span:last-child");
    if (pie) pie.textContent = `[ ${nuevo.split("\n").length} líneas escritas ]`;
  },
  async cerrarEditor(guardar, nuevo) {
    const e = this.editando; if (!e) return;
    if (guardar) { await this.pfs.writeFile(e.p, nuevo.endsWith("\n") || !nuevo ? nuevo : nuevo + "\n", "utf8"); this.t.term.write(`[ ${nuevo.split("\n").length} líneas escritas en ${e.nombre} ]\r\n`); }
    this.editando = null;
    this.alEditar?.();
    e.fin();
    setTimeout(() => this.t.term.focus(), 50);
  },
};
