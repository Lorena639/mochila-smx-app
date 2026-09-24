// =============================================================
//  herr-guias.js — Explicación fácil de cada herramienta
//   · nivel (básico / medio / avanzado)
//   · qué es y cuándo lo usas en clase
//   · un ejemplo que se rellena solo
//   · palabras clave (mini diccionario)
// =============================================================
export const NIVELES = {
  basico: { t: "Básico", clase: "ok" },
  medio: { t: "Medio", clase: "aviso" },
  avanzado: { t: "Avanzado", clase: "mal" },
};

export const GUIAS = {
  // ---------------- Redes ----------------
  subredes: {
    nivel: "medio",
    que: "Te dice todo sobre una red a partir de una IP: dónde empieza, dónde acaba, cuántos equipos caben y qué IP puedes dar a cada uno.",
    cuando: "Cuando configuras IPs en Packet Tracer, en un router o en Windows/Linux, y en los ejercicios de «calcula la red y el broadcast».",
    ejemplo: { subred: "192.168.10.37/26", mascara: "" },
    palabras: [
      ["IP", "La «dirección» de un equipo en la red, como el número de una casa. Ej.: 192.168.1.10."],
      ["Máscara", "Dice qué parte de la IP es la red y qué parte es el equipo. 255.255.255.0 es lo mismo que /24."],
      ["/24, /26…", "Prefijo: cuántos bits son de red. Cuanto más grande el número, más pequeña la red."],
      ["Dirección de red", "La primera IP de la red. Es el «nombre» de la red; no se da a ningún equipo."],
      ["Broadcast", "La última IP. Sirve para hablar con todos a la vez; tampoco se da a ningún equipo."],
      ["Host", "Cualquier equipo que tiene IP: PC, impresora, móvil…"],
      ["Puerta de enlace", "El router que te saca de tu red (a internet). Suele ser la primera IP útil."],
      ["IP privada", "Las que se usan dentro de casa o del insti (192.168.x.x, 10.x.x.x). No salen a internet sin el router."],
    ],
  },
  vlsm: {
    nivel: "avanzado",
    que: "Divide una red grande en redes más pequeñas de distinto tamaño, cada una justo con los equipos que necesita, sin desperdiciar IPs.",
    cuando: "En ejercicios de redes del tipo «la empresa tiene 50 PCs en Ventas, 25 en Administración…» y en prácticas de Packet Tracer con varios departamentos.",
    ejemplo: { vlsmRed: "192.168.1.0/24", vlsmLineas: "Ventas 50\nAdministración 25\nDirección 10\nEnlace 2" },
    palabras: [
      ["Subred", "Un trozo de una red más grande. Cada departamento tiene la suya."],
      ["VLSM", "Hacer subredes de tamaños diferentes (unas grandes y otras pequeñas)."],
      ["Enlace", "La red entre dos routers. Solo necesita 2 IPs, por eso se usa /30."],
      ["Hosts pedidos / Hosts", "Los que necesitas y los que realmente caben. El (+n) son los que sobran."],
    ],
  },
  ejercicios: {
    nivel: "medio",
    que: "Te pone ejercicios de subredes al azar y te corrige. Es para practicar hasta que te salgan solos.",
    cuando: "Antes de un examen de redes. Empieza en Fácil y cuando aciertes 5 seguidos pasa a Medio.",
    ejemplo: { ejNivel: "facil", _nuevoEjercicio: true },
    palabras: [
      ["Racha", "Cuántos ejercicios seguidos has acertado."],
      ["Truco", "Mira el prefijo: /24 = 256 IPs, /25 = 128, /26 = 64, /27 = 32, /28 = 16. La red empieza en un múltiplo de ese número."],
      ["Hosts utilizables", "Direcciones totales menos 2 (la de red y la de broadcast)."],
    ],
  },
  ipv6: {
    nivel: "avanzado",
    que: "Las IP nuevas, mucho más largas (8 bloques en hexadecimal). Esta herramienta las escribe completas o abreviadas y te dice de qué tipo son.",
    cuando: "En el tema de IPv6 y cuando en ipconfig ves direcciones que empiezan por fe80:: y quieres saber qué son.",
    ejemplo: { ipv6: "2001:0db8:0000:0000:0000:ff00:0042:8329", mac: "00:1A:2B:3C:4D:5E" },
    palabras: [
      ["IPv6", "Versión nueva de las IP: 128 bits en vez de 32. Hay tantas que no se acaban."],
      ["::", "Abreviatura de «un grupo de bloques que son todo ceros». Solo se puede usar una vez."],
      ["Link-local (fe80::)", "IP que solo vale dentro de tu red local. Todos los equipos se la ponen solos."],
      ["MAC", "El «DNI» de la tarjeta de red. Viene de fábrica. Ej.: 00:1A:2B:3C:4D:5E."],
      ["EUI-64", "Forma de crear la parte final de una IPv6 a partir de la MAC."],
    ],
  },
  dns: {
    nivel: "medio",
    que: "Pregunta a internet qué IP tiene una web (DNS) y te enseña tu IP pública, la que ve internet cuando navegas.",
    cuando: "En el tema de servicios de red (DNS) y para comprobar si un dominio está bien configurado.",
    ejemplo: { dnsNombre: "google.com", dnsTipo: "A" },
    palabras: [
      ["DNS", "El «listín telefónico» de internet: traduce nombres (google.com) a IPs."],
      ["Registro A", "El nombre apunta a una IPv4."],
      ["Registro MX", "Qué servidor recibe el correo de ese dominio."],
      ["TTL", "Cuántos segundos se puede guardar la respuesta antes de volver a preguntar."],
      ["IP pública", "La IP de tu router en internet. La de tu PC en casa es privada."],
    ],
  },
  // ---------------- Sistemas ----------------
  chmod: {
    nivel: "basico",
    que: "Calcula los permisos de un archivo en Linux: quién puede leerlo, modificarlo o ejecutarlo. Pulsas casillas y te da el número (755, 644…).",
    cuando: "En Linux, cuando un script no se ejecuta («Permiso denegado») o cuando te piden dar permisos a una carpeta.",
    ejemplo: { chmod: "754", chmodSim: "" },
    palabras: [
      ["r (4)", "Leer: ver el contenido."],
      ["w (2)", "Escribir: modificar o borrar."],
      ["x (1)", "Ejecutar (en carpetas: poder entrar)."],
      ["Propietario / Grupo / Otros", "El dueño del archivo, los usuarios de su grupo y todos los demás."],
      ["755", "7 = 4+2+1 (todo) para el dueño, 5 = 4+1 (leer y ejecutar) para el resto."],
    ],
  },
  cisco: {
    nivel: "avanzado",
    que: "Rellenas un formulario (nombre, contraseñas, IPs…) y te escribe los comandos para configurar un router o un switch Cisco. Luego los copias y pegas.",
    cuando: "En Packet Tracer y en las prácticas de redes con routers y switches Cisco.",
    ejemplo: { cisco: { tipo: "router", hostname: "R1", secret: "class", consola: "cisco", banner: "Acceso solo autorizado", interfaces: "g0/0 192.168.1.1/24 LAN\ng0/1 10.0.0.2/30 Internet", rutaDefecto: "10.0.0.1", dhcpRed: "192.168.1.0/24", dhcpGw: "192.168.1.1", dhcpDns: "8.8.8.8", nat: true, natFuera: "g0/1" } },
    palabras: [
      ["Router", "Conecta redes distintas (por ejemplo, tu casa con internet)."],
      ["Switch", "Conecta los equipos de una misma red (el «ladrón» de cables de red)."],
      ["Interfaz (g0/0, f0/1)", "Cada puerto del aparato. g = GigabitEthernet, f = FastEthernet."],
      ["VLAN", "Dividir un switch en varias redes separadas (Alumnos, Profes…)."],
      ["DHCP", "Servicio que reparte IPs automáticamente a los equipos."],
      ["NAT", "Hace que muchos equipos con IP privada salgan a internet con una sola IP pública."],
      ["enable secret", "Contraseña para entrar al modo administrador del aparato."],
    ],
  },
  raid: {
    nivel: "medio",
    que: "Calcula cuánto espacio te queda al juntar varios discos en un RAID y cuántos se pueden romper sin perder datos.",
    cuando: "En el tema de almacenamiento y servidores (NAS), y al montar discos en Windows Server o Linux.",
    ejemplo: { raidN: "4", raidTam: "2", raidU: "TB" },
    palabras: [
      ["RAID", "Unir varios discos para que funcionen como uno: más rápido, más seguro o las dos cosas."],
      ["RAID 0", "Reparte los datos: rápido, pero si falla un disco se pierde todo."],
      ["RAID 1", "Espejo: los dos discos guardan lo mismo."],
      ["RAID 5", "Reparte con «paridad»: aguanta que falle 1 disco."],
      ["Paridad", "Datos extra que permiten reconstruir un disco roto."],
    ],
  },
  cron: {
    nivel: "medio",
    que: "Te ayuda a programar tareas en Linux para que se hagan solas (por ejemplo, una copia de seguridad cada noche).",
    cuando: "En Linux, cuando te piden automatizar algo con crontab.",
    ejemplo: { cronFrec: "laborables", cronHora: "14:30", cronCmd: "/home/lorena/copia.sh", cronExpr: "0 3 * * 0" },
    palabras: [
      ["cron", "El «despertador» de Linux: ejecuta comandos a la hora que le digas."],
      ["crontab -e", "Comando para abrir tu lista de tareas programadas."],
      ["*", "«Cualquiera»: * en la hora = todas las horas."],
      ["*/15", "«Cada 15»: cada 15 minutos, cada 15 horas…"],
      ["Script (.sh)", "Archivo con varios comandos seguidos."],
    ],
  },
  // ---------------- Seguridad ----------------
  contrasenas: {
    nivel: "basico",
    que: "Crea contraseñas seguras y te dice si una contraseña es fuerte o débil (y por qué).",
    cuando: "Cuando creas usuarios en un servidor, configuras un router o el wifi, y en el tema de seguridad.",
    ejemplo: { pwProbar: "Lorena2026" },
    palabras: [
      ["Fuerza bruta", "Probar contraseñas una detrás de otra hasta acertar. Por eso la longitud importa."],
      ["Entropía", "Lo difícil que es adivinarla, en «bits». Más bits = más segura."],
      ["Frase de contraseña", "Varias palabras juntas: fácil de recordar y difícil de adivinar."],
      ["2FA", "Además de la contraseña, un código en el móvil."],
    ],
  },
  hash: {
    nivel: "medio",
    que: "Calcula la «huella digital» de un archivo o texto. Si cambia una sola letra, la huella cambia entera.",
    cuando: "Para comprobar que una ISO (Windows, Ubuntu) se ha descargado bien, comparándola con la que pone la web.",
    ejemplo: { hashTexto: "hola", hashComparar: "", _calcularHash: true },
    palabras: [
      ["Hash", "Un código fijo que resume un archivo. No se puede «deshacer» para sacar el archivo."],
      ["SHA-256", "El tipo de hash más usado hoy para comprobar descargas."],
      ["MD5", "Hash antiguo. Vale para comprobar descargas, no para seguridad."],
      ["ISO", "Archivo con el contenido de un CD/DVD, por ejemplo el instalador de Windows."],
    ],
  },
  codificar: {
    nivel: "basico",
    que: "Convierte texto a otros formatos (Base64, URL, hexadecimal, binario) y al revés.",
    cuando: "Cuando ves texto raro tipo «SG9sYQ==» o «%20» en una URL y quieres saber qué pone.",
    ejemplo: { codModo: "base64", codDir: "cod", codTexto: "Hola SMX" },
    palabras: [
      ["Codificar", "Escribir lo mismo de otra forma. No es cifrar: cualquiera lo puede deshacer."],
      ["Base64", "Forma de meter datos (fotos, archivos) dentro de texto."],
      ["%20", "Así se escribe un espacio dentro de una URL."],
      ["Hexadecimal", "Números en base 16 (0-9 y A-F). Muy usado en informática."],
    ],
  },
  regex: {
    nivel: "avanzado",
    que: "Prueba «expresiones regulares»: patrones para buscar textos con forma concreta (emails, IPs, DNIs…).",
    cuando: "En Linux con grep, en programación y para validar formularios.",
    ejemplo: { rePatron: "[\\w.+-]+@[\\w-]+\\.[\\w.]+", reFlags: "gi", reTexto: "Escríbeme a lorena@ejemplo.com o a profe@digitechfp.com" },
    palabras: [
      ["Expresión regular", "Un patrón de búsqueda. Ej.: \\d{3} = tres números seguidos."],
      ["\\d", "Cualquier número."],
      ["\\w", "Cualquier letra, número o _."],
      ["+", "«Uno o más» del anterior."],
    ],
  },
  // ---------------- Hardware ----------------
  rj45: {
    nivel: "basico",
    que: "El orden de colores de los 8 hilos del cable de red (Ethernet) para poner el conector RJ45 con la crimpadora.",
    cuando: "En la práctica de crimpar cables de red y cuando un cable no funciona y lo compruebas con el tester.",
    ejemplo: { rjA: "B", rjB: "B" },
    palabras: [
      ["Cable de red (Ethernet)", "El cable que va del PC al router o al switch. No es wifi: es con cable."],
      ["RJ45", "El conector de plástico transparente de la punta del cable de red."],
      ["UTP / par trenzado", "El tipo de cable: 8 hilos trenzados de dos en dos para evitar interferencias."],
      ["T568A / T568B", "Los dos órdenes de colores posibles. En España se usa casi siempre el B."],
      ["Directo", "Mismo orden en las dos puntas (B-B). Es el normal: PC ↔ switch."],
      ["Cruzado", "Orden distinto en cada punta (A-B). Antes se usaba para PC ↔ PC."],
      ["Crimpadora", "La herramienta que aprieta el conector RJ45 al cable."],
      ["Tester", "Aparato que comprueba que los 8 hilos llegan bien."],
    ],
  },
  transferencia: {
    nivel: "basico",
    que: "Calcula cuánto tarda en copiarse o descargarse algo, y convierte unidades (MB, GB, Mbps…).",
    cuando: "Cuando no entiendes por qué con «600 Megas» de fibra descargas a 75 MB/s, o por qué tu disco de 1 TB sale como 931 GB.",
    ejemplo: { trTam: "4.7", trUT: "GB", trVel: "100", trUV: "Mbps", uVal: "1", uUni: "TB" },
    palabras: [
      ["bit (b) y byte (B)", "1 byte = 8 bits. Las velocidades van en bits (Mbps) y los archivos en bytes (MB)."],
      ["Mbps", "Megabits por segundo: velocidad de internet. 100 Mbps = 12,5 MB/s."],
      ["GB y GiB", "GB = 1000 MB (fabricantes). GiB = 1024 MiB (lo que muestra Windows)."],
    ],
  },
  sai: {
    nivel: "medio",
    que: "Calcula qué SAI necesitas: la batería que mantiene encendidos los equipos cuando se va la luz.",
    cuando: "En el tema de montaje y mantenimiento, y cuando te piden elegir un SAI para una oficina o un servidor.",
    ejemplo: { sai: [{ nombre: "PC de oficina", w: 150, n: 4 }, { nombre: "Monitor 24\"", w: 30, n: 4 }, { nombre: "Switch 24 puertos", w: 30, n: 1 }, { nombre: "Router / ONT", w: 15, n: 1 }], saiFp: "0.6" },
    palabras: [
      ["SAI", "Sistema de Alimentación Ininterrumpida: una batería grande para los equipos. En inglés, UPS."],
      ["W (vatios)", "Lo que gasta de verdad un aparato."],
      ["VA", "Potencia «aparente». Los SAI se venden en VA, por eso hay que convertir."],
      ["Factor de potencia", "El número para pasar de W a VA (VA = W ÷ factor)."],
    ],
  },
  presupuesto: {
    nivel: "basico",
    que: "Haces la lista de piezas de un ordenador con sus precios y te suma el total (con o sin IVA). Lo puedes descargar para Excel.",
    cuando: "En las prácticas de montaje de ordenadores y cuando te piden un presupuesto para un «cliente».",
    ejemplo: { pcNombre: "PC ofimática", pcIva: true, pcMontaje: "30", pc: [
      { comp: "Procesador (CPU)", modelo: "AMD Ryzen 5 5600G", precio: "120" },
      { comp: "Placa base", modelo: "B550M", precio: "95" },
      { comp: "Memoria RAM", modelo: "16 GB DDR4 3200", precio: "40" },
      { comp: "Almacenamiento (SSD)", modelo: "SSD NVMe 500 GB", precio: "40" },
      { comp: "Fuente de alimentación", modelo: "550 W 80+ Bronze", precio: "50" },
      { comp: "Caja", modelo: "Micro-ATX", precio: "45" },
    ] },
    palabras: [
      ["CPU", "El procesador: el «cerebro» del ordenador."],
      ["Placa base", "Donde se conecta todo. Tiene que ser compatible con la CPU (socket) y la RAM."],
      ["RAM", "Memoria rápida y temporal. Se borra al apagar."],
      ["SSD / NVMe", "Disco sin partes móviles, mucho más rápido que el disco duro de toda la vida."],
      ["Fuente de alimentación", "Da corriente a todas las piezas."],
    ],
  },
  // ---------------- Referencia ----------------
  conversor: {
    nivel: "basico",
    que: "Pasa números entre decimal, binario y hexadecimal.",
    cuando: "Para las IPs y máscaras en binario, y en los ejercicios de sistemas de numeración.",
    ejemplo: { valor: "192", base: "10" },
    palabras: [
      ["Decimal", "Los números de siempre (base 10)."],
      ["Binario", "Solo 0 y 1 (base 2). Es como «piensa» el ordenador."],
      ["Hexadecimal", "Base 16: 0-9 y A-F. Se usa en MAC, colores web e IPv6."],
      ["Octeto", "Cada uno de los 4 números de una IP. Va de 0 a 255 (8 bits)."],
    ],
  },
  chuletas: {
    nivel: "basico",
    que: "Los comandos más usados de Linux, Windows y Cisco, y los puertos más importantes, con lo que hace cada uno.",
    cuando: "En cualquier práctica, cuando no te acuerdas de un comando. Usa el buscador.",
    ejemplo: { cat: "linux", buscar: "ip" },
    palabras: [
      ["Comando", "Una orden que escribes en la terminal."],
      ["Terminal / consola", "La ventana negra donde se escriben comandos (CMD, PowerShell, Bash)."],
      ["Puerto", "Una «puerta» numerada por la que entra cada servicio: 80 web, 22 SSH, 53 DNS…"],
    ],
  },
  diccionario: {
    nivel: "basico",
    que: "Todas las palabras técnicas de la app en un solo buscador, y un diccionario de inglés técnico (lo que sale en Packet Tracer, Windows Server o los manuales).",
    cuando: "Cuando un profe o un manual usa una palabra que no conoces.",
    ejemplo: { dicQ: "gateway", dicModo: "todo" },
    palabras: [["Glosario", "Lista de palabras con su significado."], ["Inglés técnico", "Las palabras en inglés que salen en los programas y comandos."]],
  },
  terminal: {
    nivel: "basico",
    que: "Una terminal de Linux de mentira para practicar comandos (ls, cd, mkdir, chmod…). Nada de lo que hagas afecta a tu ordenador.",
    cuando: "Antes de las prácticas de Linux o para repasar comandos para el examen. Completa los retos.",
    palabras: [
      ["Terminal", "La ventana donde escribes órdenes al sistema."], ["Directorio", "Carpeta."], ["Ruta absoluta", "Empieza por / (desde la raíz): /home/lorena/Documentos."],
      ["Ruta relativa", "Desde donde estás: Documentos, ../practicas…"], ["~", "Tu carpeta personal (/home/lorena)."], [">", "Guarda la salida de un comando en un archivo (lo sobrescribe). >> lo añade al final."],
    ],
  },
  checklists: {
    nivel: "basico",
    que: "Listas paso a paso de las prácticas típicas para ir marcando lo que haces y no saltarte nada.",
    cuando: "Durante la práctica, con el móvil al lado. Luego la puedes guardar en tus apuntes.",
    palabras: [["Checklist", "Lista de comprobación: pasos que vas marcando."], ["Pulsera antiestática", "Evita que la electricidad de tu cuerpo estropee las piezas."], ["Ámbito (DHCP)", "El rango de IPs que reparte el servidor."], ["Controlador de dominio", "El servidor que tiene Active Directory."]],
  },
  biblioteca: {
    nivel: "basico",
    que: "Trozos de código de los lenguajes más usados, listos para copiar, con lo que hace cada uno.",
    cuando: "Cuando programas (HTML, CSS, Python…) y no te acuerdas de cómo se escribía algo.",
    ejemplo: { bib: "python", bibBuscar: "" },
    palabras: [
      ["Lenguaje de programación", "La forma de escribir instrucciones para el ordenador: Python, Java, JavaScript…"],
      ["HTML / CSS", "HTML es el contenido de una web; CSS, cómo se ve."],
      ["Variable", "Una «caja» con nombre donde guardas un dato."],
      ["Función", "Un trozo de código con nombre que puedes usar muchas veces."],
    ],
  },
};
