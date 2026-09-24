// =============================================================
//  sb-linux.js — Linux DE VERDAD dentro de la app
//  Un PC virtual (v86) arranca un Linux Buildroot 2020.05
//  (kernel 5.6 + BusyBox). Lo que escribes lo ejecuta Linux.
//  La primera vez descarga ~8 MB; luego queda guardado.
// =============================================================
import { cargarScript, cargarXterm, crearTerminal } from "./sb-terminal.js";

const V86 = "https://cdn.jsdelivr.net/npm/v86@0.5.462/build/";
const IMG = "https://cdn.jsdelivr.net/npm/@capytale/os-emulator@0.1.6/lib/images/";
const ARCHIVOS = {
  bios: [IMG + "seabios/image.bin"],
  vga: [IMG + "vgabios/image.bin"],
  linux: [IMG + "linux-essential/image.bin", "https://i.copy.sh/buildroot-bzimage.bin"],
};
const CACHE = "mochila-sandbox-v1";

// Descarga con progreso y lo guarda para la próxima vez
async function traer(urls, alProgreso) {
  let cache = null;
  try { cache = await caches.open(CACHE); } catch { /* sin Cache Storage */ }
  for (const url of urls) {
    try {
      const guardada = await cache?.match(url);
      if (guardada) { const b = await guardada.arrayBuffer(); alProgreso?.(b.byteLength, b.byteLength); return b; }
      const r = await fetch(url);
      if (!r.ok) throw new Error(r.status);
      const total = Number(r.headers.get("content-length")) || 0;
      const lector = r.body?.getReader();
      let buf;
      if (lector) {
        const trozos = []; let n = 0;
        for (;;) { const { done, value } = await lector.read(); if (done) break; trozos.push(value); n += value.length; alProgreso?.(n, total); }
        const u = new Uint8Array(n); let o = 0; for (const t of trozos) { u.set(t, o); o += t.length; }
        buf = u.buffer;
      } else buf = await r.arrayBuffer();
      try { await cache?.put(url, new Response(buf.slice(0))); } catch { /* lleno */ }
      return buf;
    } catch { /* se prueba la siguiente dirección */ }
  }
  throw new Error("No se ha podido descargar Linux. Revisa tu conexión y vuelve a intentarlo.");
}

// Lo que se hace nada más arrancar (no se ve en pantalla)
const PREPARAR = [
  "export TERM=xterm-256color",
  "hostname pc-lorena",
  `export PS1='\\[\\e[1;32m\\]root@\\h\\[\\e[0m\\]:\\[\\e[1;34m\\]\\w\\[\\e[0m\\]\\$ '`,
  "mkdir -p /root/Documentos /root/Descargas /root/Escritorio /home",
  "printf 'nameserver 8.8.8.8\\nnameserver 1.1.1.1\\n' > /etc/resolv.conf",
  `printf 'Esto es un Linux de verdad (Buildroot + BusyBox).\\nPrueba: ls -l, cd, mkdir, nano no hay: usa vi.\\nSi rompes algo, pulsa Reiniciar.\\n' > /root/Documentos/leeme.txt`,
  `printf 'Pepe\\nAna\\nLorena\\nMarc\\nAna\\n' > /root/Documentos/alumnos.txt`,
  "alias ll='ls -l'",
  "cd /root",
];

export const linux = {
  estado: "apagado", // apagado · descargando · arrancando · listo · error
  progreso: "",
  error: "",
  t: null, emu: null, pendiente: "", alCambiar: null,
  get activo() { return this.estado === "listo"; },

  async encender(alCambiar) {
    if (this.estado === "descargando" || this.estado === "arrancando" || this.estado === "listo") return;
    this.alCambiar = alCambiar;
    const aviso = () => this.alCambiar?.();
    try {
      this.estado = "descargando"; this.error = ""; this.progreso = "Preparando…"; aviso();
      const partes = { bios: 0, vga: 0, linux: 0 }; const totales = { bios: 131072, vga: 36352, linux: 5166352 };
      const pinta = () => {
        const n = Object.values(partes).reduce((a, b) => a + b, 0), tot = Object.values(totales).reduce((a, b) => a + b, 0);
        this.progreso = `Descargando Linux… ${(n / 1048576).toFixed(1)} de ${(tot / 1048576).toFixed(1)} MB`;
        const el = document.getElementById("sbProgreso"); if (el) el.textContent = this.progreso;
      };
      await Promise.all([cargarScript(V86 + "libv86.js"), cargarXterm()]);
      const [bios, vga, img] = await Promise.all(Object.entries(ARCHIVOS).map(([k, urls]) =>
        traer(urls, (n, tot) => { partes[k] = n; if (tot) totales[k] = tot; pinta(); })));
      this.estado = "arrancando"; this.progreso = "Arrancando Linux…"; aviso();
      if (!this.t) this.t = crearTerminal("linux");
      const term = this.t.term;
      let salida = "", preparado = false, visible = false;
      const emu = new window.V86({
        wasm_path: V86 + "v86.wasm", memory_size: 64 * 1024 * 1024, vga_memory_size: 2 * 1024 * 1024,
        bios: { buffer: bios }, vga_bios: { buffer: vga }, bzimage: { buffer: img },
        cmdline: "tsc=reliable mitigations=off random.trust_cpu=on", autostart: true,
        disable_keyboard: true, disable_mouse: true, disable_speaker: true,
      });
      this.emu = emu;
      emu.add_listener("serial0-output-byte", (b) => {
        const c = String.fromCharCode(b);
        if (visible) { term.write(c); return; }
        salida += c;
        // Cuando sale el primer prompt, se prepara todo sin que se vea
        if (!preparado && /~% $/.test(salida)) {
          preparado = true;
          const { cols, rows } = term;
          emu.serial0_send([`stty rows ${rows} cols ${cols}`, ...PREPARAR, "clear", "printf '\\137_LISTO__\\n'"].join("; ") + "\n");
        }
        const i = salida.indexOf("__LISTO__");
        if (preparado && i >= 0) {
          visible = true;
          term.reset();
          const resto = salida.slice(i + 9).replace(/^\r?\n/, "");
          term.write("\x1b[2mLinux Buildroot 2020.05 · kernel 5.6 (i686) · esto es un Linux de verdad dentro de tu navegador\x1b[0m\r\n");
          term.write(resto);
          this.estado = "listo"; this.progreso = ""; aviso();
          if (this.pendiente) { emu.serial0_send(this.pendiente); this.pendiente = ""; }
        }
      });
      term.onData((d) => { if (this.estado === "listo") emu.serial0_send(d); });
    } catch (e) {
      this.estado = "error"; this.error = e.message || String(e); aviso();
    }
  },
  enviar(d) { if (this.estado === "listo") this.emu.serial0_send(d); else this.pendiente += d; },
  // Para que no gaste batería cuando no se ve
  pausar() { if (this.emu && this.estado === "listo" && this.emu.is_running()) this.emu.stop(); },
  seguir() { if (this.emu && this.estado === "listo" && !this.emu.is_running()) this.emu.run(); },
  async apagar() {
    try { await this.emu?.destroy(); } catch { /* ya estaba */ }
    this.emu = null; this.estado = "apagado"; this.pendiente = "";
    if (this.t) { this.t.term.dispose(); this.t.host.remove(); this.t = null; }
  },
};
