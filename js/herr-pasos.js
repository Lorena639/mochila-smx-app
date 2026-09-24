// =============================================================
//  herr-pasos.js — «¿Cómo se ha hecho?» de cada herramienta
//  Explica, paso a paso y desde cero, cómo se llega al resultado
//  del ejemplo. Pensado para alguien que empieza (nivel junior).
//  Cada paso: [qué haces, por qué / cómo].
// =============================================================
export const PASOS = {
  subredes: {
    intro: "Ejemplo: 192.168.10.37/26. Queremos saber a qué red pertenece esa IP y qué IPs se pueden usar.",
    pasos: [
      ["Mira el /26", "Significa que los primeros 26 bits (de 32) son de RED. Los 6 que sobran (32 − 26) son para los equipos (hosts)."],
      ["Saca la máscara", "26 unos seguidos de ceros: 11111111.11111111.11111111.11000000 → 255.255.255.192. El último octeto es 128 + 64 = 192."],
      ["Cuenta direcciones", "Con 6 bits de host hay 2⁶ = 64 direcciones por subred. Se restan 2 (la de red y la de broadcast) → 62 equipos."],
      ["Calcula el salto", "256 − 192 = 64. Las subredes van de 64 en 64 en el último octeto: .0, .64, .128, .192."],
      ["Busca dónde cae tu IP", "37 está entre 0 y 63 → la red es 192.168.10.0."],
      ["Broadcast", "Es la última de ese bloque: la siguiente red (.64) menos 1 → 192.168.10.63."],
      ["Rango útil", "Primera: red + 1 = .1 · Última: broadcast − 1 = .62. Esas son las que puedes poner a los PCs."],
    ],
    truco: "Truco de examen: haz la tabla del salto (256 − último octeto de la máscara) y busca entre qué dos múltiplos cae tu IP.",
  },
  vlsm: {
    intro: "Ejemplo: repartir 192.168.1.0/24 entre Ventas (50), Administración (25), Dirección (10) y un Enlace (2).",
    pasos: [
      ["Ordena de mayor a menor", "Siempre se empieza por la subred que más equipos necesita: 50, 25, 10, 2. Así no se quedan huecos."],
      ["Ventas: 50 equipos", "Busca la potencia de 2 que, quitando 2, llega a 50: 2⁶ = 64 → 62 hosts. 6 bits de host → /26. Empieza en .0 → 192.168.1.0/26 (del .0 al .63)."],
      ["Administración: 25", "2⁵ = 32 → 30 hosts → /27. Empieza donde terminó la anterior: .64 → 192.168.1.64/27 (del .64 al .95)."],
      ["Dirección: 10", "2⁴ = 16 → 14 hosts → /28. Empieza en .96 → 192.168.1.96/28 (del .96 al .111)."],
      ["Enlace: 2", "Un enlace entre dos routers solo necesita 2 IPs: 2² = 4 → 2 hosts → /30. Empieza en .112 → 192.168.1.112/30."],
      ["Lo que sobra", "Desde 192.168.1.116 queda libre para el futuro."],
    ],
    truco: "Recuerda: /30 → 2 hosts · /29 → 6 · /28 → 14 · /27 → 30 · /26 → 62 · /25 → 126 · /24 → 254.",
  },
  ejercicios: {
    intro: "La app te inventa una IP con su máscara. Para resolverlo, sigue siempre el mismo orden:",
    pasos: [
      ["1. Máscara", "Pasa el /prefijo a máscara (o al revés). Ej.: /27 → 255.255.255.224."],
      ["2. Salto", "256 − el octeto «raro» de la máscara (el que no es 255 ni 0). Ej.: 256 − 224 = 32."],
      ["3. Red", "Busca el múltiplo del salto justo por debajo (o igual) de tu IP en ese octeto."],
      ["4. Broadcast", "Siguiente múltiplo − 1."],
      ["5. Hosts", "2^(bits de host) − 2."],
      ["6. Comprueba", "Escribe tus respuestas y pulsa Comprobar: te dice cuáles has acertado."],
    ],
  },
  ipv6: {
    intro: "Ejemplo: 2001:0db8:0000:0000:0000:ff00:0042:8329 y la MAC 00:1A:2B:3C:4D:5E.",
    pasos: [
      ["Cómo es una IPv6", "8 grupos de 4 cifras hexadecimales (0-9 y a-f), separados por «:». En total 128 bits."],
      ["Regla 1: ceros de delante", "En cada grupo se pueden quitar los ceros de la izquierda: 0db8 → db8, 0000 → 0, 0042 → 42."],
      ["Resultado parcial", "2001:db8:0:0:0:ff00:42:8329"],
      ["Regla 2: «::»", "El grupo más largo de ceros seguidos se cambia por «::», y solo UNA vez: 2001:db8::ff00:42:8329."],
      ["Tipo", "2001:db8::/32 está reservada para documentación (sale en libros y ejemplos)."],
      ["EUI-64 (de la MAC)", "Partes la MAC en dos: 00:1A:2B | 3C:4D:5E y metes FF:FE en medio → 00:1A:2B:FF:FE:3C:4D:5E."],
      ["Invierte el 7.º bit", "El primer byte 00 = 00000000 → cambias el 7.º bit → 00000010 = 02. Queda 02:1A:2B:FF:FE:3C:4D:5E."],
      ["Dirección de enlace local", "Se pone fe80:: delante: fe80::21a:2bff:fe3c:4d5e."],
    ],
  },
  dns: {
    intro: "Ejemplo: registro A de google.com.",
    pasos: [
      ["Qué pregunta la app", "Le pregunta a un servidor DNS público (Cloudflare) por internet: «¿qué IP tiene google.com?»."],
      ["Registro A", "Es la IPv4 del dominio. AAAA sería la IPv6, MX el servidor de correo, CNAME un alias."],
      ["TTL", "Los segundos que tu PC puede guardar la respuesta en caché antes de volver a preguntar."],
      ["Compruébalo tú", "En la terminal de Windows del Sandbox escribe nslookup google.com, o en Linux real ping google.com."],
    ],
  },
  chmod: {
    intro: "Ejemplo: chmod 754.",
    pasos: [
      ["Tres cifras = tres personas", "1.ª cifra: el dueño · 2.ª: el grupo · 3.ª: el resto (otros)."],
      ["Cada permiso vale un número", "r (leer) = 4 · w (escribir) = 2 · x (ejecutar) = 1. Se suman."],
      ["7 = dueño", "4 + 2 + 1 = rwx: puede leer, escribir y ejecutar."],
      ["5 = grupo", "4 + 1 = r-x: puede leer y ejecutar, pero no cambiarlo."],
      ["4 = otros", "4 = r--: solo leer."],
      ["Resultado", "rwxr-xr-- → la orden sería chmod 754 archivo. Pruébalo de verdad en el Sandbox → Linux con ls -l."],
    ],
  },
  cisco: {
    intro: "Ejemplo: router R1 con LAN, salida a internet, DHCP y NAT. La app escribe las órdenes en el orden correcto:",
    pasos: [
      ["enable → configure terminal", "Pasas de modo usuario (R1>) a privilegiado (R1#) y luego a configuración (R1(config)#)."],
      ["hostname R1", "Le pone nombre al router."],
      ["enable secret class", "Contraseña para entrar en modo privilegiado (se guarda cifrada)."],
      ["line console 0 · password cisco · login", "Contraseña para cuando te conectas con el cable de consola."],
      ["banner motd", "Mensaje que ve quien se conecta."],
      ["interface g0/0 · ip address … · no shutdown", "A cada puerto se le pone IP y máscara, y se enciende (los puertos del router vienen apagados)."],
      ["ip route 0.0.0.0 0.0.0.0 10.0.0.1", "Ruta por defecto: todo lo que no conozca, lo manda al 10.0.0.1 (el router de internet)."],
      ["ip dhcp pool", "Reparte IPs a los PCs de la LAN: la red, la puerta de enlace (default-router) y el DNS."],
      ["NAT (overload)", "ip nat inside en la LAN, ip nat outside en la salida y una lista que dice quién puede salir. Así muchos PCs salen con una sola IP pública."],
      ["copy running-config startup-config", "Guarda: si no, al reiniciar se pierde todo."],
    ],
  },
  raid: {
    intro: "Ejemplo: 4 discos de 2 TB.",
    pasos: [
      ["RAID 0", "Reparte los datos entre todos: 4 × 2 = 8 TB. Muy rápido, pero si falla UN disco lo pierdes todo."],
      ["RAID 1", "Espejo: todos los discos guardan lo mismo → solo 2 TB útiles, pero aguanta que fallen 3."],
      ["RAID 5", "Usa el espacio de un disco para la «paridad» (un cálculo para reconstruir): (4 − 1) × 2 = 6 TB. Aguanta 1 fallo."],
      ["RAID 6", "Doble paridad: (4 − 2) × 2 = 4 TB. Aguanta 2 fallos."],
      ["RAID 10", "Dos espejos unidos: la mitad → 4 TB. Rápido y seguro."],
      ["Ojo", "RAID no es una copia de seguridad: si borras un archivo, se borra en todos los discos."],
    ],
  },
  cron: {
    intro: "Ejemplo: ejecutar /home/lorena/copia.sh de lunes a viernes a las 14:30.",
    pasos: [
      ["Una línea = 5 campos + orden", "minuto · hora · día del mes · mes · día de la semana · lo que se ejecuta."],
      ["Minuto y hora", "14:30 → minuto 30, hora 14."],
      ["Días", "Día del mes y mes van con * (todos). Día de la semana 1-5 = de lunes a viernes (0 o 7 es domingo)."],
      ["Resultado", "30 14 * * 1-5 /home/lorena/copia.sh"],
      ["Y al revés", "0 3 * * 0 → minuto 0, hora 3, cualquier día y mes, los domingos → «los domingos a las 3:00»."],
      ["Dónde se pone", "En Linux: crontab -e, pegas la línea y guardas."],
    ],
  },
  contrasenas: {
    intro: "Ejemplo: comprobar «Lorena2026».",
    pasos: [
      ["Longitud", "Tiene 10 caracteres. Cuanto más larga, mejor: lo recomendable son 12 o más."],
      ["Tipos de caracteres", "Tiene mayúsculas, minúsculas y números (62 posibles por posición), pero ningún símbolo."],
      ["Combinaciones", "62¹⁰ ≈ 839.000 billones. Parece mucho, pero…"],
      ["El problema", "Es un nombre + un año: los programas de ataque prueban primero diccionarios de nombres y fechas, y la sacan en segundos."],
      ["Cómo mejorarla", "Una frase larga que solo tú entiendas: «MiGato-Come-3-Tacos!» es mucho más segura y fácil de recordar."],
    ],
  },
  hash: {
    intro: "Ejemplo: el hash de «hola».",
    pasos: [
      ["Qué es un hash", "Una «huella» de un texto o archivo: siempre mide lo mismo y, si cambias una letra, cambia entero."],
      ["SHA-256 de «hola»", "b221d9db…4ddb79 (64 cifras hex = 256 bits)."],
      ["MD5 de «hola»", "4d186321c1a7f0f354b297e8914ab240. MD5 ya no es seguro, pero se sigue viendo para comprobar descargas."],
      ["Prueba", "Cambia «hola» por «Hola»: el resultado no se parece en nada. Eso es el efecto avalancha."],
      ["Para qué sirve", "Comprobar que una ISO descargada no está corrupta (comparas su SHA-256 con el de la web) y guardar contraseñas sin guardarlas tal cual."],
    ],
  },
  codificar: {
    intro: "Ejemplo: «Hola SMX» en Base64.",
    pasos: [
      ["Texto → bytes", "Cada letra es un byte: H=72, o=111, l=108, a=97, espacio=32…"],
      ["De 3 en 3", "Base64 coge los bytes de 3 en 3 (24 bits) y los parte en 4 trozos de 6 bits."],
      ["Cada trozo → una letra", "6 bits = 64 posibilidades → A-Z, a-z, 0-9, + y /."],
      ["El «=» del final", "Si al final no hay 3 bytes completos, se rellena con «=»."],
      ["Resultado", "SG9sYSBTTVg="],
      ["Ojo", "Codificar NO es cifrar: cualquiera lo decodifica. Se usa para mandar datos binarios como texto (correos, imágenes en HTML…)."],
    ],
  },
  regex: {
    intro: "Ejemplo: buscar correos con [\\w.+-]+@[\\w-]+\\.[\\w.]+",
    pasos: [
      ["[\\w.+-]+", "Uno o más caracteres que sean letra, número, _, punto, + o guion → el usuario (lorena)."],
      ["@", "Una arroba, tal cual."],
      ["[\\w-]+", "El nombre del dominio (ejemplo, digitechfp)."],
      ["\\.", "Un punto de verdad (sin la barra, el punto significa «cualquier carácter»)."],
      ["[\\w.]+", "La terminación: com, es, co.uk…"],
      ["Opciones g i", "g = busca todas las coincidencias, no solo la primera · i = no distingue mayúsculas."],
    ],
  },
  rj45: {
    intro: "Ejemplo: T568B en las dos puntas.",
    pasos: [
      ["Orden T568B", "1 blanco-naranja · 2 naranja · 3 blanco-verde · 4 azul · 5 blanco-azul · 6 verde · 7 blanco-marrón · 8 marrón."],
      ["Mismo orden en las dos puntas", "B-B (o A-A) = cable directo: PC con switch, switch con router."],
      ["Distinto orden", "A en una punta y B en la otra = cable cruzado: PC con PC (hoy casi todos los equipos lo detectan solos: Auto-MDIX)."],
      ["Cómo se hace", "Pelas, ordenas, cortas recto, metes hasta el fondo del conector y crimpas. Luego lo pruebas con el tester."],
    ],
  },
  transferencia: {
    intro: "Ejemplo: ¿cuánto tarda en bajar un archivo de 4,7 GB con una conexión de 100 Mbps?",
    pasos: [
      ["Bytes y bits", "Los archivos se miden en BYTES (B) y las conexiones en BITS por segundo (b). 1 byte = 8 bits."],
      ["Pasa el archivo a bits", "4,7 GB = 4.700.000.000 bytes × 8 = 37.600.000.000 bits."],
      ["Divide por la velocidad", "100 Mbps = 100.000.000 bits por segundo → 37.600.000.000 ÷ 100.000.000 = 376 segundos."],
      ["Resultado", "≈ 6 min 16 s (en la realidad algo más, por pérdidas de la red)."],
      ["KB vs KiB", "1 TB (lo que pone la caja del disco, 10¹² bytes) = 931 GiB (lo que te enseña Windows, en base 1024). Por eso «falta» espacio."],
    ],
  },
  sai: {
    intro: "Ejemplo: 4 PCs, 4 monitores, un switch y un router.",
    pasos: [
      ["Suma los vatios", "4 × 150 + 4 × 30 + 30 + 15 = 765 W."],
      ["Pasa a VA", "Los SAI se venden en VA. VA = W ÷ factor de potencia (0,6) → 765 ÷ 0,6 = 1.275 VA."],
      ["Deja margen", "Se añade un 25 % para no ir al límite: 1.275 × 1,25 ≈ 1.594 VA."],
      ["Elige", "El siguiente tamaño comercial por encima: un SAI de 2.000 VA."],
    ],
  },
  presupuesto: {
    intro: "Ejemplo: PC de ofimática.",
    pasos: [
      ["Lista de piezas", "CPU, placa, RAM, disco, fuente, caja… cada una con su precio y cantidad."],
      ["Compatibilidad", "La CPU tiene que encajar en el socket de la placa, y la RAM ser del tipo que admite (DDR4/DDR5)."],
      ["Subtotal", "Suma precio × cantidad de cada pieza."],
      ["IVA", "Si los precios son sin IVA, se multiplica por 1,21 (21 %)."],
      ["Montaje", "Se suma la mano de obra. Así sale el total que le darías a un cliente."],
    ],
  },
  conversor: {
    intro: "Ejemplo: el número 192.",
    pasos: [
      ["A binario", "Busca las potencias de 2 que suman 192: 128 + 64 = 192. Pones 1 en esas y 0 en el resto: 128 64 32 16 8 4 2 1 → 1 1 0 0 0 0 0 0."],
      ["Resultado", "192 = 11000000 (por eso la máscara /26 acaba en .192)."],
      ["A hexadecimal", "Divide entre 16: 192 ÷ 16 = 12 y sobra 0. 12 en hex es C → C0."],
      ["Truco", "Parte el binario en grupos de 4: 1100 | 0000 → 12 | 0 → C0."],
    ],
  },
  chuletas: {
    intro: "Ejemplo: buscar «ip» en las chuletas de Linux.",
    pasos: [
      ["Elige el sistema", "Linux, Windows, Cisco, puertos…"],
      ["Escribe una palabra", "Filtra al momento las órdenes que la contienen, en la orden o en su explicación."],
      ["Pruébalo", "Copia la orden y pégala en el Sandbox (Linux es de verdad) para ver qué hace."],
    ],
  },
  diccionario: {
    intro: "Ejemplo: buscar «gateway».",
    pasos: [
      ["Busca en inglés o castellano", "Mira en todas las palabras clave de las herramientas y en el inglés técnico."],
      ["Mira de dónde sale", "La etiqueta de la derecha te lleva a la herramienta donde se usa."],
    ],
  },
  biblioteca: {
    intro: "Ejemplo: la chuleta de Python.",
    pasos: [
      ["Elige el lenguaje", "Arriba tienes HTML, CSS, JavaScript, Python, SQL…"],
      ["Lee la explicación", "Debajo de cada trozo de código pone qué hace."],
      ["Pruébalo", "Con «Probar en Sandbox» se abre el código en el Sandbox para cambiarlo y ver qué pasa."],
    ],
  },
};
