// Pruebas de las herramientas de js/herramientas.js y js/herr-seguridad.js
// Valores de referencia comprobados a mano (libros de redes y RFC)
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularSubred, alEscribir } from "../js/herramientas.js";
import { generarPassword, probarRegex } from "../js/herr-seguridad.js";
import { expandirIPv6, comprimirIPv6, eui64, calcularVLSM } from "../js/herr-redes.js";

test("subred /26: red, broadcast, primer y último host", () => {
  const r = calcularSubred("192.168.10.37/26");
  assert.equal(r.red, "192.168.10.0");
  assert.equal(r.broadcast, "192.168.10.63");
  assert.equal(r.primero, "192.168.10.1");
  assert.equal(r.ultimo, "192.168.10.62");
  assert.equal(r.hosts, 62);
});

test("subred con máscara separada y casos límite /31 y /32", () => {
  assert.equal(calcularSubred("192.168.1.130", "255.255.255.128").red, "192.168.1.128");
  assert.equal(calcularSubred("10.0.0.0/31").hosts, 2);
  assert.equal(calcularSubred("10.0.0.1/32").hosts, 1);
});

test("subred rechaza máscaras con unos y ceros mezclados", () => {
  assert.throws(() => calcularSubred("10.0.0.1", "255.0.255.0"), /1 tienen que ir seguidos/);
});

test("IPv6: expandir, comprimir y EUI-64", () => {
  assert.equal(expandirIPv6("::1").join(":"), "0000:0000:0000:0000:0000:0000:0000:0001");
  assert.equal(comprimirIPv6(expandirIPv6("2001:0db8:0000:0000:0000:ff00:0042:8329")), "2001:db8::ff00:42:8329");
  assert.equal(comprimirIPv6(expandirIPv6("fe80:0:0:0:1:0:0:1")), "fe80::1:0:0:1");
  assert.equal(eui64("00:1A:2B:3C:4D:5E").join(":"), "021a:2bff:fe3c:4d5e");
});

test("VLSM reparte 100, 50 y 20 hosts en un /24", () => {
  const { res } = calcularVLSM("192.168.0.0/24", "A 100\nB 50\nC 20");
  assert.deepEqual(res.map((r) => r.cidr), [25, 26, 27]);
  assert.equal(res[2].red, "192.168.0.192");
});

test("el generador de contraseñas nunca devuelve vacío", () => {
  const p = generarPassword({ largo: 12, min: false, may: false, num: false, sim: false });
  assert.equal(p.length, 12);
  assert.match(p, /^[a-z]+$/);
});

test("cambiar una opción de contraseña la regenera con las nuevas reglas", () => {
  const t = { pwLargo: "20" };
  assert.equal(alEscribir(t, "pwLargo", "24"), true);
  assert.equal(t.pwGen.length, 24);
  alEscribir(t, "pwNum", false);
  assert.doesNotMatch(t.pwGen, /\d/);
});

test("el probador de regex encuentra las coincidencias", () => {
  assert.deepEqual(probarRegex("\\d+", "", "a1b22").m.map((x) => x[0]), ["1", "22"]);
});
