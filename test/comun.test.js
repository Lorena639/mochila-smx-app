// Pruebas de las utilidades puras de js/comun.js
// Ejecutar con: npm test  (requiere Node.js 18 o superior)
import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, normalizar, formato } from "../js/comun.js";

test("esc escapa los caracteres peligrosos de HTML", () => {
  assert.equal(esc("<b>&\"'</b>"), "&lt;b&gt;&amp;&quot;&#39;&lt;/b&gt;");
});

test("esc convierte null y undefined en texto vacío", () => {
  assert.equal(esc(null), "");
  assert.equal(esc(undefined), "");
});

test("normalizar quita tildes y pasa a minúsculas", () => {
  assert.equal(normalizar("Él Está AQUÍ"), "el esta aqui");
});

test("formato aplica negrita y escapa el HTML de entrada", () => {
  assert.match(formato("**hola**"), /<strong>hola<\/strong>/);
  const html = formato("<img src=x onerror=alert(1)>");
  assert.ok(!html.includes("<img"), "no debe colarse una etiqueta img");
});

test("formato no genera enlaces javascript:", () => {
  const html = formato("[pulsa](javascript:alert(1))");
  assert.ok(!/href="javascript:/i.test(html));
});
