// =============================================================
//  github.js — Leer y guardar archivos del repositorio con la API
//  de GitHub. Solo lo usa el panel admin.
//  El "inicio de sesión" es un token personal de GitHub: sin él
//  nadie puede modificar los archivos del repositorio.
// =============================================================

const API = "https://api.github.com";

// Deduce usuario y repositorio a partir de la dirección de la web:
//   usuario.github.io/mochila-smx/  ->  usuario / mochila-smx
//   usuario.github.io/              ->  usuario / usuario.github.io
export function repoDesdeUrl(loc = location) {
  const m = loc.hostname.match(/^([^.]+)\.github\.io$/i);
  if (!m) return null;
  const usuario = m[1];
  const primera = loc.pathname.split("/").filter(Boolean)[0];
  const repo = primera && !/\.html?$/i.test(primera) ? primera : `${usuario}.github.io`;
  return { usuario, repo };
}

// Codifica texto UTF-8 (con tildes y ñ) a base64 y al revés
const aBase64 = (texto) => {
  const bytes = new TextEncoder().encode(texto);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const deBase64 = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

export class GitHub {
  constructor(token, usuario, repo) {
    this.token = token;
    this.usuario = usuario;
    this.repo = repo;
    this.rama = null;
  }

  async peticion(ruta, opciones = {}) {
    const r = await fetch(`${API}${ruta}`, {
      ...opciones,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opciones.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!r.ok) {
      const e = new Error(`GitHub respondió ${r.status}`);
      e.status = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }

  // Comprueba que el token funciona y que tiene permiso de escritura
  async comprobar() {
    const info = await this.peticion(`/repos/${this.usuario}/${this.repo}`);
    if (!info.permissions || !info.permissions.push) {
      const e = new Error("Este token no tiene permiso para modificar el repositorio.");
      e.status = 403;
      throw e;
    }
    this.rama = info.default_branch;
    return info;
  }

  // Devuelve { texto, sha } o null si el archivo no existe todavía
  async leer(ruta) {
    try {
      const f = await this.peticion(`/repos/${this.usuario}/${this.repo}/contents/${ruta}?ref=${this.rama}`);
      let b64 = f.content || "";
      // Archivos de más de 1 MB: GitHub no manda el contenido aquí, hay que pedir el "blob"
      if (!b64 && f.size > 0) b64 = (await this.peticion(`/repos/${this.usuario}/${this.repo}/git/blobs/${f.sha}`)).content || "";
      return { texto: deBase64(b64), sha: f.sha };
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  // Crea o actualiza un archivo (hace un commit)
  async escribir(ruta, texto, sha, mensaje) {
    const r = await this.peticion(`/repos/${this.usuario}/${this.repo}/contents/${ruta}`, {
      method: "PUT",
      body: JSON.stringify({ message: mensaje, content: aBase64(texto), branch: this.rama, ...(sha ? { sha } : {}) }),
    });
    return r.content.sha;
  }

  // Devuelve solo el sha de un archivo (o null si no existe)
  async sha(ruta) {
    try {
      const f = await this.peticion(`/repos/${this.usuario}/${this.repo}/contents/${ruta}?ref=${this.rama}`);
      return f.sha;
    } catch (e) {
      if (e.status === 404) return null;
      throw e;
    }
  }

  // Borra un archivo del repositorio (si existe)
  async borrar(ruta, mensaje) {
    const sha = await this.sha(ruta);
    if (!sha) return;
    await this.peticion(`/repos/${this.usuario}/${this.repo}/contents/${ruta}`, {
      method: "DELETE",
      body: JSON.stringify({ message: mensaje, sha, branch: this.rama }),
    });
  }
}
