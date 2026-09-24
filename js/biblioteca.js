// =============================================================
//  biblioteca.js — Chuletas de programación con ejemplos
//  HTML, CSS, JavaScript, Python, Java, C, C++, PHP, SQL, Linux, Windows y Git
//  Cada trozo de código se puede abrir en el Sandbox para probarlo.
//  + conceptos clave de SMX. Funciona sin internet.
// =============================================================
import { esc, normalizar } from "./comun.js";
import { icono } from "./iconos.js";
import { sePuedeProbar, abrirDesdeBiblioteca } from "./sandbox.js";

// Cada entrada: [código, explicación]
export const BIBLIOTECA = {
  html: { nombre: "HTML", desc: "Estructura de las páginas web", secciones: [
    { t: "Esqueleto de una página", items: [
      [`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi página</title>
  <link rel="stylesheet" href="estilos.css">
</head>
<body>
  <h1>Hola</h1>
  <script src="app.js"></script>
</body>
</html>`, "Plantilla base. El viewport hace que se vea bien en el móvil."],
    ] },
    { t: "Texto", items: [
      ["<h1>…</h1> … <h6>…</h6>", "Títulos: solo un h1 por página, y sin saltar niveles."],
      ["<p>Párrafo</p>  <br>  <hr>", "Párrafo, salto de línea y línea horizontal."],
      ["<strong>importante</strong> <em>énfasis</em>", "Negrita y cursiva con significado."],
      ["<!-- comentario -->", "Comentario: no se ve en la página."],
    ] },
    { t: "Enlaces e imágenes", items: [
      [`<a href="https://ejemplo.com" target="_blank" rel="noopener">Enlace</a>`, "Enlace que se abre en otra pestaña."],
      [`<a href="#contacto">Ir a contacto</a>`, "Enlace a un id de la misma página."],
      [`<img src="foto.jpg" alt="Descripción de la foto" width="300">`, "Imagen. El alt es obligatorio (accesibilidad)."],
    ] },
    { t: "Listas y tablas", items: [
      [`<ul>
  <li>Elemento</li>
</ul>
<ol>
  <li>Primero</li>
</ol>`, "Lista con viñetas (ul) y numerada (ol)."],
      [`<table>
  <thead><tr><th>Nombre</th><th>Nota</th></tr></thead>
  <tbody><tr><td>Ana</td><td>8</td></tr></tbody>
</table>`, "Tabla: tr = fila, th = cabecera, td = celda."],
    ] },
    { t: "Formularios", items: [
      [`<form action="/enviar" method="post">
  <label for="email">Email</label>
  <input type="email" id="email" name="email" required>
  <button type="submit">Enviar</button>
</form>`, "Formulario básico. El for del label = id del input."],
      [`<input type="text|password|number|date|checkbox|radio|file">`, "Tipos de input más usados."],
      [`<select name="curso"><option value="1">1º</option></select>
<textarea name="msg" rows="4"></textarea>`, "Desplegable y área de texto."],
    ] },
    { t: "Estructura semántica", items: [
      [`<header> <nav> <main> <section> <article> <aside> <footer>`, "Etiquetas con significado: mejor que usar div para todo."],
      [`<div class="caja">…</div>  <span>…</span>`, "Contenedores genéricos: div es de bloque, span va en línea."],
    ] },
  ] },

  css: { nombre: "CSS", desc: "Diseño y estilos", secciones: [
    { t: "Selectores", items: [
      ["p { }   .clase { }   #id { }", "Etiqueta, clase e id."],
      ["nav a { }   ul > li { }", "Descendiente (dentro) e hijo directo."],
      ["a:hover { }   li:first-child { }   input:focus { }", "Pseudoclases: estados y posición."],
      ["p::first-line { }   .x::before { content: '→ '; }", "Pseudoelementos."],
    ] },
    { t: "Texto y colores", items: [
      [`body {
  font-family: Arial, sans-serif;
  font-size: 16px;
  color: #333;
  line-height: 1.5;
}`, "Fuente, tamaño, color y altura de línea."],
      ["text-align: center; font-weight: bold; text-decoration: none;", "Alineación, negrita y quitar subrayado."],
      ["color: #ff0000; color: rgb(255 0 0); color: hsl(0 100% 50%);", "Formas de escribir un color."],
    ] },
    { t: "Modelo de caja", items: [
      [`.caja {
  width: 300px;
  padding: 16px;        /* dentro */
  border: 1px solid #ccc;
  margin: 20px auto;    /* fuera; auto = centrar */
  box-sizing: border-box;
}`, "Contenido + padding + borde + margen. box-sizing hace que el width lo incluya todo."],
      ["border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,.2);", "Esquinas redondeadas y sombra."],
    ] },
    { t: "Flexbox", items: [
      [`.fila {
  display: flex;
  justify-content: space-between; /* eje principal */
  align-items: center;            /* eje cruzado */
  gap: 10px;
  flex-wrap: wrap;
}`, "Colocar elementos en fila (o columna con flex-direction: column)."],
      [".hijo { flex: 1; }", "El hijo ocupa el espacio que sobra."],
    ] },
    { t: "Grid", items: [
      [`.rejilla {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}`, "Rejilla de 3 columnas iguales."],
      ["grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));", "Columnas que se adaptan solas al ancho."],
    ] },
    { t: "Responsive", items: [
      [`@media (max-width: 600px) {
  .rejilla { grid-template-columns: 1fr; }
}`, "Estilos solo para pantallas pequeñas (móvil)."],
      ["img { max-width: 100%; height: auto; }", "Imágenes que no se salen de la pantalla."],
    ] },
    { t: "Posición y otros", items: [
      ["position: relative | absolute | fixed | sticky; top: 0;", "absolute se coloca respecto al padre con relative."],
      ["display: none | block | inline | inline-block;", "Cómo se muestra el elemento."],
      [":root { --principal: #0a84c6; }  color: var(--principal);", "Variables CSS."],
      ["transition: all .3s ease;", "Animación suave al cambiar una propiedad."],
    ] },
  ] },

  javascript: { nombre: "JavaScript", desc: "Programación en la web", secciones: [
    { t: "Variables y tipos", items: [
      [`let edad = 20;        // se puede cambiar
const nombre = "Ana"; // no se puede reasignar
typeof edad;          // "number"`, "Usa const por defecto y let si cambia. Evita var."],
      ["`Hola, ${nombre}`", "Plantillas de texto (con comillas invertidas)."],
    ] },
    { t: "Condiciones", items: [
      [`if (nota >= 5) {
  console.log("Aprobado");
} else if (nota >= 4) {
  console.log("Casi");
} else {
  console.log("Suspenso");
}`, "if / else if / else."],
      ["=== !== && || !", "Compara siempre con === (valor y tipo)."],
      ["const r = nota >= 5 ? 'Apto' : 'No apto';", "Operador ternario."],
    ] },
    { t: "Bucles", items: [
      ["for (let i = 0; i < 5; i++) { console.log(i); }", "for clásico."],
      ["for (const x of lista) { … }", "Recorrer los elementos de un array."],
      ["while (condicion) { … }", "Mientras se cumpla."],
    ] },
    { t: "Funciones", items: [
      [`function sumar(a, b) {
  return a + b;
}
const doble = (n) => n * 2;`, "Función normal y función flecha."],
    ] },
    { t: "Arrays y objetos", items: [
      [`const notas = [7, 5, 9];
notas.push(8);
notas.length;
notas.map(n => n + 1);
notas.filter(n => n >= 7);
notas.reduce((s, n) => s + n, 0);`, "Añadir, largo, transformar, filtrar y sumar."],
      [`const alumno = { nombre: "Ana", nota: 8 };
alumno.nombre;
const { nombre, nota } = alumno;`, "Objeto, acceso a propiedad y desestructuración."],
      ["JSON.stringify(obj)  /  JSON.parse(texto)", "Pasar a texto JSON y al revés."],
    ] },
    { t: "DOM (la página)", items: [
      [`const boton = document.querySelector("#enviar");
boton.addEventListener("click", () => {
  document.querySelector("h1").textContent = "¡Hola!";
});`, "Buscar un elemento y reaccionar a un clic."],
      [`el.classList.add("activo");
el.style.color = "red";
const div = document.createElement("div");
document.body.appendChild(div);`, "Cambiar clases y estilos, crear elementos."],
    ] },
    { t: "Asíncrono", items: [
      [`async function cargar() {
  try {
    const r = await fetch("https://api.ejemplo.com/datos");
    const datos = await r.json();
    console.log(datos);
  } catch (e) {
    console.error("Error:", e);
  }
}`, "Pedir datos a una API con fetch."],
      ["setTimeout(() => { … }, 1000);", "Ejecutar algo pasado 1 segundo."],
    ] },
  ] },

  python: { nombre: "Python", desc: "El módulo pendiente de 1º", secciones: [
    { t: "Básico", items: [
      [`nombre = input("¿Cómo te llamas? ")
edad = int(input("Edad: "))
print(f"Hola {nombre}, tienes {edad} años")`, "Leer datos (input devuelve texto: conviértelo con int o float)."],
      ["int() float() str() bool() type(x)", "Conversiones y ver el tipo."],
      ["# comentario", "Comentario de una línea."],
      ["// división entera   % resto   ** potencia", "Operadores útiles: 7 // 2 = 3, 7 % 2 = 1, 2 ** 3 = 8."],
    ] },
    { t: "Condiciones", items: [
      [`if nota >= 5:
    print("Aprobado")
elif nota >= 4:
    print("Casi")
else:
    print("Suspenso")`, "La sangría (4 espacios) marca los bloques."],
      ["and  or  not  ==  !=  in", "Operadores lógicos y de comparación."],
    ] },
    { t: "Bucles", items: [
      [`for i in range(1, 11):
    print(i)`, "range(1, 11) va del 1 al 10."],
      [`while True:
    op = input("Opción (s para salir): ")
    if op == "s":
        break`, "Bucle con salida por break."],
      [`for i, x in enumerate(lista):
    print(i, x)`, "Recorrer con índice."],
    ] },
    { t: "Cadenas", items: [
      [`t = "Hola Mundo"
t.upper()  t.lower()  t.strip()
t.split(" ")  t.replace("Hola", "Adiós")
len(t)  t[0]  t[-1]  t[0:4]`, "Métodos y cortes (slicing)."],
    ] },
    { t: "Listas, tuplas y diccionarios", items: [
      [`notas = [7, 5, 9]
notas.append(8)
notas.remove(5)
sum(notas) / len(notas)
max(notas)  min(notas)  sorted(notas)`, "Listas: añadir, quitar, media, máximo…"],
      ["dobles = [n * 2 for n in notas if n >= 5]", "Lista por comprensión."],
      [`agenda = {"Ana": "600111222"}
agenda["Luis"] = "600333444"
for nombre, tlf in agenda.items():
    print(nombre, tlf)
agenda.get("Pepe", "No existe")`, "Diccionario clave → valor."],
      ["punto = (3, 4)   conjunto = {1, 2, 3}", "Tupla (no se cambia) y conjunto (sin repetidos)."],
    ] },
    { t: "Funciones", items: [
      [`def es_primo(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True`, "Función con return."],
      ["def saludar(nombre=\"Invitado\"):", "Parámetro con valor por defecto."],
    ] },
    { t: "Errores y ficheros", items: [
      [`try:
    x = int(input("Número: "))
    print(10 / x)
except ValueError:
    print("Eso no es un número")
except ZeroDivisionError:
    print("No se puede dividir entre 0")`, "Controlar errores."],
      [`with open("datos.txt", "w", encoding="utf-8") as f:
    f.write("Hola\\n")
with open("datos.txt", encoding="utf-8") as f:
    for linea in f:
        print(linea.strip())`, "Escribir y leer un fichero."],
    ] },
    { t: "Módulos y clases", items: [
      [`import random, math
random.randint(1, 10)
math.sqrt(16)`, "Importar módulos."],
      [`class Alumno:
    def __init__(self, nombre, nota):
        self.nombre = nombre
        self.nota = nota

    def aprobado(self):
        return self.nota >= 5

a = Alumno("Ana", 7)
print(a.aprobado())`, "Clase con constructor y método."],
    ] },
  ] },

  java: { nombre: "Java", desc: "Orientado a objetos y tipado", secciones: [
    { t: "Programa base", items: [
      [`public class Main {
    public static void main(String[] args) {
        System.out.println("Hola");
    }
}`, "El archivo se llama igual que la clase: Main.java."],
      ["javac Main.java && java Main", "Compilar y ejecutar desde la terminal."],
    ] },
    { t: "Variables y entrada", items: [
      [`int edad = 20;
double nota = 7.5;
boolean ok = true;
char letra = 'A';
String nombre = "Ana";
final int MAX = 10; // constante`, "Tipos básicos."],
      [`import java.util.Scanner;
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
String linea = sc.nextLine();`, "Leer del teclado."],
    ] },
    { t: "Control", items: [
      [`if (nota >= 5) { … } else { … }
switch (dia) {
    case 1 -> System.out.println("Lunes");
    default -> System.out.println("Otro");
}`, "if y switch."],
      [`for (int i = 0; i < 10; i++) { … }
for (int x : array) { … }
while (cond) { … }`, "Bucles."],
    ] },
    { t: "Arrays y listas", items: [
      [`int[] notas = {7, 5, 9};
notas.length;
import java.util.ArrayList;
ArrayList<String> nombres = new ArrayList<>();
nombres.add("Ana");
nombres.get(0);
nombres.size();`, "Array fijo y ArrayList (crece)."],
    ] },
    { t: "Métodos y clases", items: [
      [`public static int sumar(int a, int b) {
    return a + b;
}`, "Método estático."],
      [`public class Alumno {
    private String nombre;
    public Alumno(String nombre) { this.nombre = nombre; }
    public String getNombre() { return nombre; }
}
Alumno a = new Alumno("Ana");`, "Clase con atributo privado, constructor y getter (encapsulación)."],
      ["class Perro extends Animal { @Override … }", "Herencia y sobrescritura."],
    ] },
    { t: "Excepciones", items: [
      [`try {
    int x = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("No es un número");
} finally {
    sc.close();
}`, "Capturar errores."],
    ] },
  ] },

  c: { nombre: "C", desc: "Bajo nivel y memoria", secciones: [
    { t: "Programa base", items: [
      [`#include <stdio.h>

int main(void) {
    printf("Hola\\n");
    return 0;
}`, "Todo programa empieza en main."],
      ["gcc programa.c -o programa && ./programa", "Compilar y ejecutar."],
    ] },
    { t: "Variables y E/S", items: [
      [`int n = 5; float f = 2.5f; double d = 3.14;
char c = 'A'; char nombre[20] = "Ana";`, "Tipos básicos. Las cadenas son arrays de char."],
      [`scanf("%d", &n);
printf("n = %d, f = %.2f, texto = %s\\n", n, f, nombre);`, "%d entero · %f decimal · %c carácter · %s cadena. scanf necesita & (menos en cadenas)."],
    ] },
    { t: "Control", items: [
      [`if (n > 0) { … } else { … }
for (int i = 0; i < 10; i++) { … }
while (n > 0) { n--; }
do { … } while (cond);`, "Condiciones y bucles."],
      [`switch (op) {
    case 1: …; break;
    default: …;
}`, "switch: no olvides el break."],
    ] },
    { t: "Funciones y arrays", items: [
      [`int sumar(int a, int b) { return a + b; }
int v[5] = {1, 2, 3, 4, 5};`, "Función y array."],
      [`#include <string.h>
strlen(s); strcpy(dest, orig); strcmp(a, b);`, "Funciones de cadenas."],
    ] },
    { t: "Punteros y memoria", items: [
      [`int x = 10;
int *p = &x;   // p guarda la dirección de x
*p = 20;       // cambia x a 20`, "& = dirección · * = valor al que apunta."],
      [`#include <stdlib.h>
int *v = malloc(10 * sizeof(int));
free(v);`, "Memoria dinámica: todo malloc necesita su free."],
      [`struct Alumno { char nombre[30]; float nota; };
struct Alumno a = {"Ana", 7.5};`, "Estructuras."],
    ] },
  ] },

  cpp: { nombre: "C++", desc: "C con objetos y librería estándar", secciones: [
    { t: "Programa base", items: [
      [`#include <iostream>
using namespace std;

int main() {
    string nombre;
    cout << "Nombre: ";
    cin >> nombre;
    cout << "Hola " << nombre << endl;
    return 0;
}`, "Entrada con cin, salida con cout."],
      ["g++ main.cpp -o main && ./main", "Compilar y ejecutar."],
    ] },
    { t: "Contenedores (STL)", items: [
      [`#include <vector>
vector<int> v = {3, 1, 2};
v.push_back(4);
v.size();
for (int x : v) cout << x << " ";`, "vector: array que crece."],
      [`#include <map>
map<string, int> edades;
edades["Ana"] = 20;`, "map: clave → valor."],
      [`#include <algorithm>
sort(v.begin(), v.end());`, "Ordenar."],
    ] },
    { t: "Clases", items: [
      [`class Alumno {
private:
    string nombre;
    double nota;
public:
    Alumno(string n, double no) : nombre(n), nota(no) {}
    bool aprobado() const { return nota >= 5; }
};
Alumno a("Ana", 7);`, "Clase con constructor e inicialización."],
      ["class Perro : public Animal { … };", "Herencia."],
      ["void cambiar(int &x) { x = 5; }", "Paso por referencia (&): cambia la variable original."],
    ] },
  ] },

  php: { nombre: "PHP", desc: "Servidor web", secciones: [
    { t: "Básico", items: [
      [`<?php
$nombre = "Ana";
echo "Hola $nombre";
?>`, "Las variables empiezan por $. Con comillas dobles se sustituyen."],
      [`$notas = [7, 5, 9];
foreach ($notas as $n) { echo $n; }
$alumno = ["nombre" => "Ana", "nota" => 8];`, "Arrays normales y asociativos."],
      ["function sumar($a, $b) { return $a + $b; }", "Función."],
    ] },
    { t: "Formularios y BD", items: [
      [`$email = $_POST["email"] ?? "";
$id = $_GET["id"] ?? null;
echo htmlspecialchars($email);`, "Leer datos de un formulario. Escapa siempre lo que muestras."],
      [`$pdo = new PDO("mysql:host=localhost;dbname=tienda;charset=utf8mb4", "usuario", "clave");
$st = $pdo->prepare("SELECT * FROM clientes WHERE id = ?");
$st->execute([$id]);
$cliente = $st->fetch();`, "Consulta preparada con PDO (evita la inyección SQL)."],
      ["session_start(); $_SESSION['usuario'] = 'ana';", "Sesiones."],
    ] },
  ] },

  sql: { nombre: "SQL", desc: "Bases de datos (MySQL / MariaDB)", secciones: [
    { t: "Crear", items: [
      [`CREATE DATABASE tienda;
USE tienda;
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  alta DATE DEFAULT (CURRENT_DATE)
);`, "Base de datos y tabla con clave primaria."],
      [`CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT,
  total DECIMAL(8,2),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);`, "Clave foránea (relación)."],
    ] },
    { t: "Consultar", items: [
      ["SELECT nombre, email FROM clientes WHERE nombre LIKE 'A%' ORDER BY nombre LIMIT 10;", "Filtrar, ordenar y limitar."],
      ["SELECT cliente_id, COUNT(*), SUM(total) FROM pedidos GROUP BY cliente_id HAVING SUM(total) > 100;", "Agrupar con funciones de agregado."],
      [`SELECT c.nombre, p.total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id;`, "Unir tablas (JOIN). LEFT JOIN incluye clientes sin pedidos."],
    ] },
    { t: "Modificar", items: [
      ["INSERT INTO clientes (nombre, email) VALUES ('Ana', 'ana@mail.com');", "Insertar."],
      ["UPDATE clientes SET email = 'nuevo@mail.com' WHERE id = 1;", "Actualizar: ¡sin WHERE cambia todas las filas!"],
      ["DELETE FROM clientes WHERE id = 1;", "Borrar: ¡sin WHERE las borra todas!"],
      ["ALTER TABLE clientes ADD telefono VARCHAR(15);", "Añadir una columna."],
    ] },
    { t: "Usuarios", items: [
      [`CREATE USER 'web'@'localhost' IDENTIFIED BY 'clave';
GRANT SELECT, INSERT ON tienda.* TO 'web'@'localhost';
FLUSH PRIVILEGES;`, "Usuario con permisos mínimos."],
      ["mysqldump -u root -p tienda > copia.sql", "Copia de seguridad (terminal)."],
    ] },
  ] },

  bash: { nombre: "Linux / Bash", desc: "Comandos de Linux y scripts para automatizar", secciones: [
    { t: "Comandos básicos (pruébalos en la terminal de arriba)", items: [
      ["pwd", "Dice en qué carpeta estás."],
      ["ls -l", "Lista lo que hay, con permisos, dueño y tamaño."],
      ["cd Documentos", "Entra en una carpeta. cd .. sube una; cd ~ vuelve a tu carpeta personal."],
      ["mkdir -p practicas/tema1", "Crea carpetas (con -p también las de en medio)."],
      ["touch notas.txt", "Crea un archivo vacío."],
      ["echo hola > notas.txt", "Escribe en un archivo (lo sobrescribe). Con >> añade al final."],
      ["cat notas.txt", "Muestra lo que tiene un archivo."],
      ["cp notas.txt copia.txt", "Copia. Para carpetas: cp -r."],
      ["mv copia.txt practicas", "Mueve (o cambia el nombre si el destino no es una carpeta)."],
      ["rm -r practicas/tema1", "Borra. ¡En Linux no hay papelera!"],
      ["chmod 755 script.sh", "Permisos: 7 dueño (rwx), 5 grupo (r-x), 5 otros (r-x)."],
      ["ip a", "Tus direcciones IP."],
      ["ping 8.8.8.8", "Comprueba si llegas a un equipo."],
    ] },
    { t: "Script base", items: [
      [`#!/bin/bash
nombre="Ana"
echo "Hola $nombre"
read -p "Tu edad: " edad
echo "Tienes $edad años"`, "Sin espacios alrededor del =. Dale permisos con chmod +x script.sh."],
      ["$1 $2 … $# $@ $?", "Argumentos, número de argumentos, todos, y resultado del último comando (0 = bien)."],
      ["fecha=$(date +%F)", "Guardar la salida de un comando."],
    ] },
    { t: "Condiciones y bucles", items: [
      [`if [ -f "$archivo" ]; then
  echo "Existe"
elif [ "$n" -gt 10 ]; then
  echo "Mayor que 10"
else
  echo "Nada"
fi`, "-f archivo · -d carpeta · -eq -ne -gt -lt -ge -le números · = != textos."],
      [`for f in *.log; do
  echo "$f"
done
for i in {1..5}; do echo $i; done`, "Recorrer archivos o números."],
      [`while read -r linea; do
  echo "$linea"
done < lista.txt`, "Leer un archivo línea a línea."],
    ] },
    { t: "Ejemplo: copia de seguridad", items: [
      [`#!/bin/bash
origen="/home/usuario/documentos"
destino="/backup/copia-$(date +%F).tar.gz"
tar -czf "$destino" "$origen" && echo "Copia OK: $destino"
find /backup -name "copia-*.tar.gz" -mtime +7 -delete`, "Comprime una carpeta y borra copias de más de 7 días. Prográmalo con cron."],
    ] },
  ] },

  windows: { nombre: "Windows (CMD / PowerShell)", desc: "La consola de Windows: CMD clásico y PowerShell", secciones: [
    { t: "Archivos y carpetas", items: [
      ["dir", "CMD: lista archivos y carpetas. En PowerShell también vale (y ls)."],
      ["Get-ChildItem", "PowerShell: lo mismo que dir. Abreviado: gci."],
      ["cd Documentos", "Entra en una carpeta. cd .. sube; cd solo dice dónde estás (en CMD)."],
      ["mkdir practicas", "Crea una carpeta (también md)."],
      ["New-Item -ItemType Directory practicas2", "PowerShell: crea una carpeta."],
      ["New-Item notas.txt", "PowerShell: crea un archivo vacío."],
      ["echo hola > notas.txt", "Guarda texto en un archivo. Con >> añade al final."],
      ["type notas.txt", "CMD: muestra un archivo. En PowerShell: Get-Content notas.txt (o cat)."],
      ["copy notas.txt practicas", "Copia. PowerShell: Copy-Item. Carpetas: xcopy /e o Copy-Item -Recurse."],
      ["move notas.txt practicas", "Mueve. PowerShell: Move-Item."],
      ["ren notas.txt apuntes.txt", "Cambia el nombre. PowerShell: Rename-Item."],
      ["del apuntes.txt", "Borra un archivo (va sin papelera)."],
      ["rmdir /s practicas", "Borra una carpeta con todo. PowerShell: Remove-Item -Recurse practicas."],
      ["tree /f", "Dibuja el árbol de carpetas (con /f, también los archivos)."],
    ] },
    { t: "Red", items: [
      ["ipconfig", "IP, máscara y puerta de enlace."],
      ["ipconfig /all", "Todo: MAC, DHCP, DNS…"],
      ["ipconfig /release", "Suelta la IP que te dio el DHCP (luego /renew pide otra)."],
      ["ipconfig /flushdns", "Borra la caché de DNS (cuando una web «no cambia»)."],
      ["ping 8.8.8.8", "¿Llego a ese equipo? En Windows manda 4 paquetes."],
      ["tracert google.com", "Por qué routers pasa el paquete."],
      ["nslookup google.com", "Pregunta al DNS la IP de un nombre."],
    ] },
    { t: "Sistema", items: [
      ["whoami", "Tu usuario (equipo\\usuario o dominio\\usuario)."],
      ["hostname", "Nombre del equipo."],
      ["systeminfo", "Datos del sistema: versión, RAM, dominio…"],
      ["tasklist", "Programas en marcha. PowerShell: Get-Process."],
      ["Get-Date", "Fecha y hora."],
      ["cls", "Limpia la pantalla (PowerShell: Clear-Host)."],
    ] },
    { t: "Scripts (.bat y .ps1)", items: [
      [`@echo off
echo Hola %USERNAME%
set carpeta=C:\\copias
if not exist %carpeta% mkdir %carpeta%
xcopy "%USERPROFILE%\\Documents" %carpeta% /e /y
pause`, "Script .bat de CMD: copia tus Documentos a C:\\copias."],
      [`$nombre = "Lorena"
Write-Host "Hola $nombre"
foreach ($f in Get-ChildItem *.txt) {
    Write-Host $f.Name $f.Length "bytes"
}`, "Script .ps1 de PowerShell: variable y bucle por los .txt."],
      ["Set-ExecutionPolicy RemoteSigned -Scope CurrentUser", "Permite ejecutar tus scripts .ps1 (por defecto Windows los bloquea)."],
    ] },
  ] },

  git: { nombre: "Git y GitHub", desc: "Control de versiones", secciones: [
    { t: "Empezar", items: [
      [`git config --global user.name "Lorena"
git config --global user.email "tu@email.com"`, "Configuración inicial (una vez)."],
      ["git init   /   git clone https://github.com/usuario/repo.git", "Crear un repositorio o descargar uno."],
    ] },
    { t: "Día a día", items: [
      ["git status", "Qué ha cambiado."],
      [`git add .
git commit -m "Añade formulario de contacto"
git push`, "Guardar cambios y subirlos a GitHub."],
      ["git pull", "Bajar los cambios de GitHub."],
      ["git log --oneline", "Historial resumido."],
      ["git diff", "Ver las diferencias antes de hacer commit."],
    ] },
    { t: "Ramas y deshacer", items: [
      [`git switch -c nueva-funcion
git switch main
git merge nueva-funcion`, "Crear rama, volver a main y unirla."],
      ["git restore archivo", "Descartar cambios de un archivo (sin commit)."],
      ["git revert <id-commit>", "Deshacer un commit creando otro (seguro)."],
      [".gitignore → node_modules/  *.log  .env", "Archivos que no se suben (¡nunca subas contraseñas!)."],
    ] },
  ] },

  conceptos: { nombre: "Conceptos SMX", desc: "Lo que siempre preguntan", secciones: [
    { t: "Modelo OSI y TCP/IP", items: [
      [`7 Aplicación   ┐
6 Presentación ├─ Aplicación  (HTTP, DNS, FTP, SSH)
5 Sesión       ┘
4 Transporte   ── Transporte  (TCP, UDP)   → segmentos
3 Red          ── Internet    (IP, ICMP)   → paquetes · router
2 Enlace       ┐                           → tramas · switch · MAC
1 Física       ┘─ Acceso a red             → bits · cable, hub`, "Truco: «Física Enlaza Redes Transportando Sesiones Presentadas en Aplicaciones»."],
      ["TCP: fiable, con conexión (web, correo, SSH) · UDP: rápido, sin conexión (DNS, DHCP, vídeo, juegos)", "Diferencia TCP / UDP."],
    ] },
    { t: "Redes", items: [
      ["DHCP: DORA = Discover → Offer → Request → Ack", "Cómo un equipo recibe IP automáticamente."],
      ["DNS: traduce nombres (google.com) a IP", "Registros: A, AAAA, MX, CNAME, NS, PTR."],
      ["NAT/PAT: varias IP privadas salen con una pública", "Lo hace el router de casa."],
      ["VLAN: separar una red física en varias lógicas", "Para comunicarlas hace falta un router o switch L3."],
      ["Gateway (puerta de enlace): el router que te saca de tu red", "Si está mal, hay red local pero no internet."],
      ["Privadas: 10.0.0.0/8 · 172.16.0.0/12 · 192.168.0.0/16", "No salen a internet sin NAT."],
    ] },
    { t: "Sistemas", items: [
      ["Dominio / Active Directory: usuarios y equipos gestionados desde un servidor", "Con GPO se aplican directivas a todos."],
      ["RAID 1 espejo · RAID 5 paridad · RAID 0 velocidad sin seguridad", "Mira la calculadora RAID."],
      ["Copias: completa · incremental (desde la última) · diferencial (desde la última completa)", "Regla 3-2-1: 3 copias, 2 soportes, 1 fuera."],
      ["MBR (hasta 2 TB, 4 primarias) · GPT (discos grandes, UEFI)", "Tablas de particiones."],
      ["Permisos NTFS vs compartidos: se aplica el más restrictivo", "Típica pregunta de examen."],
    ] },
    { t: "Seguridad", items: [
      ["Confidencialidad · Integridad · Disponibilidad (CIA)", "Los tres pilares."],
      ["Cifrado simétrico (AES, una clave) · asimétrico (RSA, pública + privada)", "HTTPS usa los dos."],
      ["Hash: huella de un archivo (SHA-256). No se puede «descifrar».", "Para comprobar que no ha cambiado y guardar contraseñas."],
      ["Phishing · malware · ransomware · DoS · MITM", "Ataques más comunes."],
      ["Autenticación en dos pasos (2FA)", "Algo que sabes + algo que tienes."],
    ] },
  ] },
};

export function vistaBiblioteca(e) {
  const t = e.herr || {};
  const q = normalizar(t.bibBuscar || "");
  const lenguaje = BIBLIOTECA[t.bib] ? t.bib : "html";
  let id = 0;
  const bloque = ([cod, exp], extra = "", lang = lenguaje) => {
    const k = `bib${id++}`;
    const probar = sePuedeProbar(lang) ? `<button type="button" class="boton peque bib-probar" data-accion="herr-bib-probar" data-de="${k}" data-l="${lang}" aria-label="Probar este código en el Sandbox">${icono("play")} Probar</button>` : "";
    return `<div class="bib-item"><div class="bib-codigo"><pre id="${k}"><code>${esc(cod)}</code></pre>
      <div class="bib-botones">${probar}<button type="button" class="boton icono peque" data-accion="herr-copiar" data-de="${k}" aria-label="Copiar">${icono("archivo")}</button></div></div>
      <p>${esc(exp)}${extra}</p></div>`;
  };
  let cuerpo;
  if (q) {
    const res = [];
    for (const [k, l] of Object.entries(BIBLIOTECA)) for (const s of l.secciones) for (const it of s.items)
      if (normalizar(`${l.nombre} ${s.t} ${it[0]} ${it[1]}`).includes(q)) res.push({ it, donde: `${l.nombre} · ${s.t}`, lang: k });
    cuerpo = res.length ? res.slice(0, 60).map((r) => bloque(r.it, ` <small class="texto-suave">· ${esc(r.donde)}</small>`, r.lang)).join("") : `<p class="texto-suave">Nada coincide.</p>`;
  } else {
    const l = BIBLIOTECA[lenguaje];
    cuerpo = `<p class="texto-suave">${esc(l.desc)}</p>` + (sePuedeProbar(lenguaje) ? `<a class="bib-sandbox" href="#sandbox/${{ bash: "linux", html: "web", css: "web", javascript: "web" }[lenguaje] || lenguaje}">${icono("cubo")} <span><b>Practica ${esc(l.nombre)} en el Sandbox</b><small>Con guía paso a paso y chuleta. O pulsa «Probar» en cualquier trozo de código.</small></span>${icono("flecha-der")}</a>` : "") + l.secciones.map((s) => `<h3 class="bib-seccion">${esc(s.t)}</h3>${s.items.map((it) => bloque(it)).join("")}`).join("");
  }
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("materias")} Biblioteca de programación</h2></div>
    <div class="filtros"><label class="buscador">${icono("buscar")}<input type="search" id="bibQ" data-herr="bibBuscar" value="${esc(t.bibBuscar || "")}" placeholder="Buscar: bucle for, flexbox, JOIN…" aria-label="Buscar en la biblioteca"></label></div>
    <div class="filtros bib-lenguajes">${Object.entries(BIBLIOTECA).map(([k, l]) => `<button type="button" class="chip" aria-pressed="${!q && lenguaje === k}" data-accion="herr-bib" data-l="${k}">${esc(l.nombre)}</button>`).join("")}</div>
    <div class="bib">${cuerpo}</div>
  </section>`;
}

export const acciones = {
  // «Probar»: abre ese código en el Sandbox
  "herr-bib-probar"(b) {
    const pre = document.getElementById(b.dataset.de);
    const destino = pre && abrirDesdeBiblioteca(b.dataset.l, pre.textContent);
    if (destino) location.hash = `#sandbox/${destino}`;
  },
  "herr-bib"(b, api) {
    const t = api.estado().herr; t.bib = b.dataset.l; t.bibBuscar = "";
    api.pintar();
  },
};
