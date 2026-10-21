// =============================================================
//  apuntes.js — Apuntes desde Obsidian
//   · Visualizar teoría, prácticas y conceptos por materia
//   · Búsqueda en apuntes
//   · Link a Obsidian para editar
// =============================================================
import { esc, icono } from "./comun.js";

let apuntesData = null;

async function cargarApuntes() {
  if (apuntesData) return apuntesData;

  try {
    const resp = await fetch('data/apuntes.json');
    apuntesData = await resp.json();
    return apuntesData;
  } catch (e) {
    console.error('Error cargando apuntes:', e);
    return null;
  }
}

export async function htmlApuntes(e) {
  const datos = await cargarApuntes();
  if (!datos) {
    return `<section class="panel"><h2>Error cargando apuntes</h2></section>`;
  }

  const { materias } = datos;
  const materiasList = Object.keys(materias).sort();

  return `
    <header class="cabecera-seccion">
      <div>
        <h1>Apuntes desde Obsidian</h1>
        <p class="texto-suave">Teoría, prácticas y conceptos de tus materias</p>
      </div>
    </header>

    <div class="apuntes-buscar">
      <input type="text" id="buscarApuntes" placeholder="Buscar en apuntes..." class="buscar-input">
    </div>

    <div id="apuntesResultados">
      ${materiasList.map(materia => {
        const apuntes = materias[materia];
        return `
          <section class="panel apuntes-materia">
            <h2 class="apuntes-titulo">${esc(materia)} <span class="chip">${apuntes.length}</span></h2>
            <div class="apuntes-lista">
              ${apuntes.map((apunte, i) => `
                <article class="apunte-item" data-materia="${esc(materia)}" data-titulo="${esc(apunte.title.toLowerCase())}">
                  <h3>${esc(apunte.title)}</h3>
                  <p class="apunte-preview">${esc(apunte.preview)}</p>
                  <small class="texto-suave">${esc(apunte.file)}</small>
                </article>
              `).join('')}
            </div>
          </section>
        `;
      }).join('')}
    </div>

    <div class="nota-pie" style="margin-top: 20px;">
      Los apuntes se sincronizan automáticamente desde tu vault de Obsidian.
      <a href="https://github.com/Lorena639/obsidian-boveda" target="_blank">Ver en GitHub</a>
    </div>
  `;
}

export function eventosApuntes(raiz) {
  const buscar = raiz.querySelector('#buscarApuntes');
  const resultados = raiz.querySelector('#apuntesResultados');

  if (!buscar) return;

  buscar.addEventListener('input', (e) => {
    const texto = e.target.value.toLowerCase();
    const items = resultados.querySelectorAll('.apunte-item');

    items.forEach(item => {
      const titulo = item.dataset.titulo;
      const visible = !texto || titulo.includes(texto);
      item.style.display = visible ? 'block' : 'none';
    });

    // Ocultar secciones vacías
    const secciones = resultados.querySelectorAll('.apuntes-materia');
    secciones.forEach(seccion => {
      const itemsVisibles = seccion.querySelectorAll('.apunte-item[style=""]');
      seccion.style.display = itemsVisibles.length > 0 ? 'block' : 'none';
    });
  });
}
