// =============================================================
//  sb-guias.js — Contenido para aprender en el Sandbox
//   · lecciones: pasos con la orden y qué hace (nivel junior)
//   · chuleta: tabla de consulta rápida
//   · ejemplos (Web, SQL, Python): código + cómo funciona
// =============================================================

export const LINUX = {
  lecciones: [
    { t: "1. Moverte por las carpetas", intro: "En Linux todo cuelga de «/» (la raíz). Tu carpeta personal es /root (eres el administrador, root).", pasos: [
      ["pwd", "Print Working Directory: te dice en qué carpeta estás ahora."],
      ["ls", "Lista lo que hay en la carpeta. Las carpetas salen en azul."],
      ["ls -l", "Lo mismo pero en formato largo: permisos, dueño, tamaño y fecha."],
      ["cd Documentos", "Change Directory: entras en la carpeta Documentos (ruta relativa: desde donde estás)."],
      ["cat leeme.txt", "Muestra lo que hay dentro de un archivo de texto."],
      ["cd ..", "«..» es la carpeta de arriba (la madre). Subes un nivel."],
      ["cd /etc", "Ruta absoluta (empieza por /): da igual dónde estés. En /etc están las configuraciones."],
      ["cd ~", "«~» es tu carpeta personal. También vale cd solo."],
    ] },
    { t: "2. Crear, copiar y borrar", intro: "Vamos a crear una carpeta de prácticas y jugar con archivos.", pasos: [
      ["mkdir practicas", "Make Directory: crea la carpeta practicas."],
      ["cd practicas", "Entras en ella."],
      ["touch notas.txt", "Crea un archivo vacío (si ya existe, solo le cambia la fecha)."],
      ["echo hola > notas.txt", "echo escribe un texto; con > lo guarda en el archivo (lo sobrescribe)."],
      ["echo adios >> notas.txt", "Con >> se AÑADE al final, sin borrar lo que había."],
      ["cat notas.txt", "Compruebas que tiene las dos líneas."],
      ["cp notas.txt copia.txt", "Copy: copia el archivo con otro nombre."],
      ["mv copia.txt apuntes.txt", "Move: mueve o, como aquí, cambia el nombre."],
      ["ls -l", "Ves los dos archivos."],
      ["rm apuntes.txt", "Remove: borra. ¡Ojo! En Linux no hay papelera."],
      ["cd ..", "Vuelves a tu carpeta personal."],
    ] },
    { t: "3. Permisos", intro: "Cada archivo tiene permisos para el dueño, el grupo y el resto: r (leer), w (escribir), x (ejecutar).", pasos: [
      ["ls -l practicas", "La primera columna (-rw-r--r--) son los permisos: 1.º el tipo, luego 3 letras para dueño, grupo y otros."],
      ["chmod 600 practicas/notas.txt", "6 = rw- para el dueño y 0 = nada para los demás. Así solo tú lo puedes leer."],
      ["ls -l practicas", "Ahora pone -rw------- ."],
      ["chmod 755 practicas", "7 = rwx dueño, 5 = r-x grupo y otros. Lo típico de las carpetas."],
      ["whoami", "Quién eres (root = el administrador)."],
      ["id", "Tu número de usuario (uid) y tus grupos."],
    ] },
    { t: "4. Buscar y filtrar", intro: "Las «tuberías» | pasan la salida de una orden a la siguiente. Es de lo más útil de Linux.", pasos: [
      ["cat Documentos/alumnos.txt", "Una lista de nombres, uno por línea."],
      ["sort Documentos/alumnos.txt", "Los ordena alfabéticamente."],
      ["sort Documentos/alumnos.txt | uniq", "sort ordena y uniq quita los repetidos (tienen que estar juntos: por eso se ordena antes)."],
      ["grep Ana Documentos/alumnos.txt", "Busca las líneas que contienen «Ana»."],
      ["wc -l Documentos/alumnos.txt", "Word Count con -l: cuenta las líneas."],
      ["ls /bin | head -5", "head enseña solo las primeras líneas (tail, las últimas)."],
      ["find / -name hosts", "Busca en todo el disco los archivos que se llamen hosts."],
    ] },
    { t: "5. Sistema y procesos", intro: "Para saber cómo está el equipo.", pasos: [
      ["uname -a", "Versión del kernel (el núcleo de Linux) y la arquitectura."],
      ["uptime", "Cuánto tiempo lleva encendido y la carga."],
      ["free", "Memoria RAM total, usada y libre (en KB)."],
      ["df -h", "Espacio de los discos; -h lo pone en MB/GB legibles."],
      ["ps", "Procesos (programas) en marcha y su PID (su número)."],
      ["top", "Los procesos en directo. Sal con la tecla q."],
      ["dmesg | tail", "Los últimos mensajes del kernel (útil cuando conectas hardware)."],
    ] },
    { t: "6. Red", intro: "Esta máquina no tiene internet, pero puedes ver su configuración de red.", pasos: [
      ["ip a", "Tus interfaces de red y sus IPs. lo es el loopback (127.0.0.1): el propio equipo."],
      ["ip route", "La tabla de rutas (por dónde salen los paquetes)."],
      ["ping -c 3 127.0.0.1", "Ping al propio equipo. -c 3 = manda solo 3 (sin -c sigue para siempre; se para con Ctrl+C)."],
      ["cat /etc/hosts", "Nombres que el equipo resuelve sin preguntar al DNS."],
      ["cat /etc/resolv.conf", "Los servidores DNS que usaría."],
    ] },
    { t: "7. Usuarios", intro: "Crear y borrar usuarios, como en las prácticas de sistemas.", pasos: [
      ["adduser -D pepe", "Crea el usuario pepe (-D: sin contraseña, para ir rápido)."],
      ["cat /etc/passwd", "Lista de usuarios: nombre:x:uid:gid:…:carpeta:shell. Verás a pepe al final."],
      ["ls /home", "Se ha creado /home/pepe."],
      ["passwd pepe", "Le pones contraseña (escríbela dos veces; no se ve al escribir, es normal)."],
      ["deluser pepe", "Lo borras."],
    ] },
    { t: "8. Tu primer script", intro: "Un script es un archivo con órdenes que se ejecutan seguidas.", pasos: [
      ["echo 'echo Hola, $1. Hoy es:; date' > saludo.sh", "Creamos saludo.sh. $1 es lo primero que le pases al ejecutarlo."],
      ["cat saludo.sh", "Miras lo que tiene."],
      ["chmod +x saludo.sh", "Le das permiso de ejecución (x)."],
      ["./saludo.sh Lorena", "./ significa «el de esta carpeta». Se ejecuta y $1 vale Lorena."],
      ["vi saludo.sh", "Editor vi: pulsa i para escribir, Esc para dejar de escribir, y :wq + Intro para guardar y salir (:q! sale sin guardar)."],
    ] },
  ],
  chuleta: [
    { t: "Carpetas", filas: [["pwd", "Dónde estoy"], ["ls -la", "Listar todo, también ocultos"], ["cd carpeta · cd .. · cd ~", "Entrar · subir · a casa"], ["mkdir -p a/b", "Crear carpetas"], ["rmdir carpeta", "Borrar carpeta vacía"], ["tree", "(No está en BusyBox) → usa find ."]] },
    { t: "Archivos", filas: [["touch f", "Crear vacío"], ["cat f · head f · tail f", "Ver"], ["cp a b · cp -r", "Copiar"], ["mv a b", "Mover / renombrar"], ["rm f · rm -r carpeta", "Borrar"], ["echo x > f · >> f", "Escribir · añadir"], ["vi f", "Editar (i, Esc, :wq)"]] },
    { t: "Permisos", filas: [["chmod 755 f", "rwx r-x r-x"], ["chmod +x f", "Hacer ejecutable"], ["chown usuario f", "Cambiar dueño"], ["r=4 w=2 x=1", "Se suman"]] },
    { t: "Buscar", filas: [["grep texto f", "Líneas que contienen"], ["find / -name x", "Buscar archivos"], ["a | b", "Tubería"], ["sort · uniq · wc -l", "Ordenar · únicos · contar"]] },
    { t: "Sistema", filas: [["uname -a", "Kernel"], ["free · df -h", "RAM · disco"], ["ps · top · kill PID", "Procesos"], ["uptime · date", "Tiempo encendido · fecha"]] },
    { t: "Red", filas: [["ip a · ifconfig", "IPs"], ["ip route", "Rutas"], ["ping -c 3 ip", "¿Responde?"], ["netstat -tln", "Puertos abiertos"]] },
    { t: "Usuarios", filas: [["whoami · id", "Quién soy"], ["adduser · deluser", "Crear · borrar"], ["passwd", "Contraseña"], ["su usuario · exit", "Cambiar de usuario · volver"]] },
    { t: "Teclas", filas: [["Tab", "Autocompletar"], ["↑ ↓", "Órdenes anteriores"], ["Ctrl+C", "Parar lo que está en marcha"], ["Ctrl+L · clear", "Limpiar pantalla"]] },
  ],
};

export const WINDOWS = {
  lecciones: [
    { t: "1. Moverte por las carpetas", intro: "En Windows las rutas empiezan por la unidad (C:) y usan «\\». Tu carpeta es C:\\Users\\lorena.", pasos: [
      ["dir", "Lista lo que hay (en PowerShell también sirve ls o Get-ChildItem). Las carpetas llevan una «d» en Mode."],
      ["cd Documentos", "Entras en Documentos."],
      ["type leeme.txt", "Muestra el contenido del archivo (en PowerShell también Get-Content o cat)."],
      ["cd ..", "Subes a la carpeta de arriba."],
      ["cd \\", "Vas a la raíz del disco: C:\\."],
      ["dir", "Ves las carpetas del sistema: Windows, Users, Program Files…"],
      ["cd Users\\lorena", "Vuelves a tu carpeta."],
    ] },
    { t: "2. Crear, copiar y borrar", intro: "Lo mismo que harías con el ratón en el Explorador, pero escribiendo.", pasos: [
      ["mkdir practicas", "Crea la carpeta practicas."],
      ["echo hola > practicas\\notas.txt", "Guarda «hola» en notas.txt (> sobrescribe, >> añade)."],
      ["type practicas\\notas.txt", "Compruebas lo que tiene."],
      ["copy Documentos\\leeme.txt practicas", "Copia leeme.txt dentro de practicas."],
      ["ren practicas\\leeme.txt info.txt", "Rename: cambia el nombre."],
      ["dir practicas", "Ves los dos archivos."],
      ["del practicas\\info.txt", "Borra el archivo (desde la consola no va a la papelera)."],
    ] },
    { t: "3. PowerShell de verdad", intro: "PowerShell tiene órdenes con forma Verbo-Nombre. Son más largas pero se entienden solas.", pasos: [
      ["Get-Location", "Dónde estás (como pwd)."],
      ["New-Item -ItemType Directory pruebas", "Crea una carpeta."],
      ["Set-Content pruebas\\a.txt \"hola desde PowerShell\"", "Crea un archivo con ese texto."],
      ["Get-Content pruebas\\a.txt", "Lo lee."],
      ["Get-ChildItem pruebas", "Lista la carpeta."],
      ["Remove-Item -Recurse pruebas", "Borra la carpeta con todo (-Recurse = con lo de dentro)."],
      ["$nombre = \"Lorena\"", "Crea una variable (en PowerShell empiezan por $)."],
      ["Write-Host \"Hola $nombre\"", "Escribe un texto usando la variable."],
    ] },
    { t: "4. Red (lo más preguntado)", intro: "Las órdenes que usarás para arreglar problemas de red.", pasos: [
      ["ipconfig", "Tu IP, máscara y puerta de enlace."],
      ["ipconfig /all", "Además: MAC (dirección física), si usas DHCP y los DNS."],
      ["ping google.com", "¿Llego a google? Windows manda 4 paquetes y te dice cuánto tardan."],
      ["ipconfig /release", "Sueltas la IP que te dio el DHCP. Mira: te queda una 169.254… (APIPA = sin servidor DHCP)."],
      ["ping google.com", "Ahora falla: sin IP no hay red."],
      ["ipconfig /renew", "Pides IP otra vez al DHCP."],
      ["tracert google.com", "Por qué routers pasa el paquete hasta llegar."],
      ["nslookup google.com", "Le preguntas al DNS la IP de un nombre."],
      ["netstat -an", "Conexiones abiertas y puertos escuchando."],
    ] },
    { t: "5. Sistema", intro: "Para saber qué equipo es y qué está haciendo.", pasos: [
      ["whoami", "Equipo\\usuario."],
      ["hostname", "Nombre del equipo."],
      ["systeminfo", "Versión de Windows, RAM, dominio…"],
      ["tasklist", "Programas en marcha (como el Administrador de tareas)."],
      ["tasklist | findstr chrome", "La tubería | pasa la salida a findstr, que filtra las líneas con «chrome»."],
      ["Get-Service", "Servicios de Windows y si están en marcha."],
    ] },
    { t: "6. CMD y PowerShell", intro: "CMD es la consola antigua; PowerShell la moderna. Casi todas las órdenes básicas sirven en las dos.", pasos: [
      ["cmd", "Cambias a CMD: fíjate en que el prompt pierde el «PS»."],
      ["dir", "En CMD el listado sale con <DIR> y los bytes libres."],
      ["echo %USERNAME%", "En CMD las variables van entre %."],
      ["exit", "Vuelves a PowerShell."],
      ["echo $env:USERNAME", "En PowerShell se escribe $env:NOMBRE."],
    ] },
  ],
  chuleta: [
    { t: "Carpetas", filas: [["dir · ls · Get-ChildItem", "Listar"], ["cd carpeta · cd .. · cd \\", "Entrar · subir · raíz"], ["mkdir · md", "Crear carpeta"], ["rmdir /s carpeta", "Borrar con todo"], ["tree /f", "Árbol"]] },
    { t: "Archivos", filas: [["type · Get-Content", "Ver"], ["echo x > f · >> f", "Escribir · añadir"], ["copy · Copy-Item", "Copiar"], ["move · Move-Item", "Mover"], ["ren · Rename-Item", "Renombrar"], ["del · Remove-Item", "Borrar"]] },
    { t: "Red", filas: [["ipconfig /all", "Configuración"], ["ipconfig /release · /renew", "Soltar · pedir IP"], ["ipconfig /flushdns", "Vaciar caché DNS"], ["ping · tracert", "¿Llego? · ¿Por dónde?"], ["nslookup nombre", "Preguntar al DNS"], ["netstat -an · arp -a · getmac", "Conexiones · vecinos · MAC"]] },
    { t: "Sistema", filas: [["whoami · hostname", "Usuario · equipo"], ["systeminfo", "Datos del sistema"], ["tasklist · Get-Process", "Procesos"], ["Get-Service", "Servicios"], ["shutdown /s /t 0 · /r", "Apagar · reiniciar"]] },
    { t: "PowerShell", filas: [["$x = \"hola\"", "Variable"], ["Write-Host $x", "Escribir"], ["orden | findstr x", "Filtrar"], ["orden | Sort-Object", "Ordenar"], ["$env:USERNAME", "Variable del sistema"]] },
    { t: "Teclas", filas: [["Tab", "Autocompletar rutas"], ["↑ ↓", "Órdenes anteriores"], ["cls", "Limpiar"], ["cmd · powershell · exit", "Cambiar de consola"]] },
  ],
};

export const GIT = {
  lecciones: [
    { t: "1. Tu primer repositorio", intro: "Git guarda «fotos» (commits) de tus archivos para poder volver atrás. Vamos a crear un proyecto.", pasos: [
      ["mkdir proyecto", "Crea la carpeta del proyecto."],
      ["cd proyecto", "Entras. Fíjate en el prompt: aún no hay rama."],
      ["git init", "Convierte la carpeta en un repositorio (crea la carpeta oculta .git). Ahora el prompt dice (main)."],
      ["git status", "Siempre que dudes, git status. Ahora: nada que hacer."],
      ["echo \"# Mi proyecto\" > README.md", "Creamos un archivo."],
      ["git status", "Sale en rojo como «sin seguimiento»: git lo ve pero no lo guarda todavía."],
      ["git add README.md", "Lo pasas al «stage» (la zona de lo que irá en la próxima foto)."],
      ["git status", "Ahora sale en verde: listo para el commit."],
      ["git commit -m \"Primer commit\"", "Haces la foto con un mensaje que explica el cambio."],
      ["git log", "El historial: cada commit tiene un código único (hash), autor, fecha y mensaje."],
    ] },
    { t: "2. Hacer cambios", intro: "El ciclo de todos los días: cambiar → add → commit.", pasos: [
      ["echo \"Hecho por Lorena\" >> README.md", "Cambias el archivo."],
      ["git status", "Sale como «modificado»."],
      ["git diff", "Qué líneas han cambiado: en verde (+) lo nuevo, en rojo (−) lo quitado."],
      ["git add .", "El punto = todo lo cambiado en esta carpeta."],
      ["git commit -m \"Añado autora\"", "Segunda foto."],
      ["git log --oneline", "El historial en una línea por commit."],
    ] },
    { t: "3. Ramas", intro: "Una rama es una línea de trabajo aparte: pruebas cosas sin estropear main.", pasos: [
      ["git branch", "Lista las ramas; el * es la tuya."],
      ["git switch -c web", "Crea la rama web y te cambia a ella (antes se hacía con git checkout -b web)."],
      ["echo \"<h1>Hola</h1>\" > index.html", "Un archivo que solo existe en esta rama."],
      ["git add .", "Lo preparas."],
      ["git commit -m \"Página inicial\"", "Lo guardas en la rama web."],
      ["ls", "Ves index.html."],
      ["git switch main", "Vuelves a main…"],
      ["ls", "…¡y index.html ha desaparecido! Está en la otra rama."],
      ["git merge web", "Unes la rama web a main (fast-forward: main simplemente avanza)."],
      ["ls", "Ahora index.html también está en main."],
      ["git log --oneline", "El historial de main incluye el commit de la rama."],
    ] },
    { t: "4. Deshacer cosas", intro: "Para cuando te equivocas.", pasos: [
      ["echo \"ERROR\" >> README.md", "Estropeamos el archivo a propósito."],
      ["git restore README.md", "Vuelve a como estaba en el último commit (se pierde el cambio)."],
      ["cat README.md", "Arreglado."],
      ["echo temporal > basura.txt", "Un archivo que no queremos."],
      ["git add basura.txt", "Lo añadimos por error…"],
      ["git restore --staged basura.txt", "…y lo sacamos del stage (el archivo sigue ahí)."],
      ["rm basura.txt", "Ahora sí lo borramos."],
      ["git status", "Todo limpio."],
    ] },
    { t: "5. Descargar un proyecto de GitHub", intro: "git clone copia un repositorio entero (con su historial). Necesita internet.", pasos: [
      ["cd ~", "Vuelves a tu carpeta personal."],
      ["git clone https://github.com/octocat/Hello-World", "Descarga el repositorio de ejemplo de GitHub."],
      ["cd Hello-World", "Entras."],
      ["git log --oneline", "Ves su historial."],
      ["cat README", "Y sus archivos."],
    ] },
  ],
  chuleta: [
    { t: "Empezar", filas: [["git init", "Crear repositorio"], ["git clone url", "Descargar uno"], ["git config user.name \"X\"", "Tu nombre"]] },
    { t: "Día a día", filas: [["git status", "¿Qué ha cambiado?"], ["git add f · git add .", "Preparar"], ["git commit -m \"msg\"", "Guardar foto"], ["git commit -am \"msg\"", "add + commit (solo archivos ya seguidos)"], ["git diff · --staged", "Ver cambios"], ["git log --oneline", "Historial"]] },
    { t: "Ramas", filas: [["git branch", "Listar"], ["git switch -c rama", "Crear y cambiar"], ["git switch rama", "Cambiar"], ["git merge rama", "Unir a la actual"], ["git branch -d rama", "Borrar"]] },
    { t: "Deshacer", filas: [["git restore f", "Descartar cambios"], ["git restore --staged f", "Sacar del stage"], ["git reset --hard", "Todo como el último commit"]] },
    { t: "GitHub (en tu PC real)", filas: [["git remote add origin url", "Enlazar"], ["git push -u origin main", "Subir"], ["git pull", "Bajar cambios"]] },
    { t: "Archivos", filas: [["ls · cd · cat · tree", "Ver"], ["echo x > f", "Escribir"], ["nano f", "Editar (Ctrl+O guarda, Ctrl+X sale)"], ["rm · mv · mkdir", "Borrar · mover · crear"]] },
  ],
};

export const PYTHON = {
  lecciones: [
    { t: "1. Python como calculadora", intro: "En la consola (>>>) cada línea se ejecuta al pulsar Intro y ves el resultado al momento.", pasos: [
      ["2 + 3 * 4", "Primero multiplica y luego suma, como en mates → 14."],
      ["(2 + 3) * 4", "Con paréntesis cambias el orden → 20."],
      ["7 / 2", "División normal → 3.5."],
      ["7 // 2", "División entera (sin decimales) → 3."],
      ["7 % 2", "El resto de la división → 1. Sirve para saber si un número es par (resto 0)."],
      ["2 ** 8", "Potencia: 2⁸ = 256 (¡las 256 direcciones de un octeto!)."],
    ] },
    { t: "2. Variables y textos", intro: "Una variable es una caja con nombre donde guardas un dato.", pasos: [
      ["nombre = \"Lorena\"", "Guardas un texto (string) en la variable nombre. No sale nada: solo se guarda."],
      ["nombre", "Escribiendo el nombre de la variable ves lo que tiene."],
      ["len(nombre)", "len cuenta los caracteres → 6."],
      ["nombre.upper()", "Métodos de texto: upper = mayúsculas."],
      ["print(f\"Hola, {nombre}\")", "Un f-string mete variables dentro del texto con { }."],
      ["type(nombre)", "Te dice el tipo: str (texto). Prueba type(5) o type(3.5)."],
    ] },
    { t: "3. Listas", intro: "Una lista guarda varios datos en orden.", pasos: [
      ["notas = [7, 5, 9, 6]", "Una lista de notas."],
      ["notas[0]", "El primero es la posición 0 (¡no la 1!) → 7."],
      ["notas.append(8)", "Añade un 8 al final."],
      ["sum(notas) / len(notas)", "La media: suma entre cuántas hay."],
      ["max(notas), min(notas)", "La más alta y la más baja."],
      ["sorted(notas)", "Una copia ordenada."],
    ] },
    { t: "4. Bucles y condiciones", intro: "Los bloques (for, if, def) acaban con una línea vacía: pulsa Intro dos veces.", pasos: [
      ["for n in notas:\n    print(n, \"aprobado\" if n >= 5 else \"suspenso\")\n", "Recorre la lista y dice si cada nota aprueba. La sangría (4 espacios) marca lo que va dentro del for."],
      ["for i in range(1, 6):\n    print(i, \"x 3 =\", i * 3)\n", "range(1, 6) da 1, 2, 3, 4, 5 (el 6 no entra). La tabla del 3."],
      ["def es_par(n):\n    return n % 2 == 0\n", "Defines una función que devuelve True si el número es par."],
      ["es_par(10), es_par(7)", "La usas: (True, False)."],
    ] },
  ],
  ejemplos: [
    { prueba: [
      ["Pon otra nota", "__ENTRADAS__", "4", "Cambia el dato de input(): con un 4 sale Suspenso."],
      ["Añade Matrícula de honor", "if nota >= 9:", "if nota == 10:\n    print(\"Matrícula de honor\")\nelif nota >= 9:", "El if nuevo va PRIMERO: si no, el >= 9 lo cogería antes."],
    ], t: "Aprobado o suspenso", codigo: 'nota = float(input("Tu nota: "))\n\nif nota >= 9:\n    print("Sobresaliente")\nelif nota >= 7:\n    print("Notable")\nelif nota >= 5:\n    print("Aprobado")\nelse:\n    print("Suspenso")\n', entradas: "7.5", explica: [
      ["input(\"Tu nota: \")", "Pide un dato. Siempre devuelve TEXTO (en el Sandbox se coge de la casilla «Datos para input()»)."],
      ["float(…)", "Convierte el texto en número con decimales para poder compararlo."],
      ["if / elif / else", "Se mira de arriba abajo y entra en el PRIMERO que se cumple. Por eso se empieza por la nota más alta."],
      ["Sangría", "Los 4 espacios indican qué está dentro de cada if."],
    ] },
    { prueba: [
      ["Añade más notas", "notas = [7, 5.5, 9, 4, 8]", "notas = [7, 5.5, 9, 4, 8, 10, 3]", "La media, máxima y aprobadas se recalculan solas: por eso se usa len() y no un 5 fijo."],
      ["Cuenta los suspensos", "print(\"Aprobadas:\", len([n for n in notas if n >= 5]))", "print(\"Aprobadas:\", len([n for n in notas if n >= 5]))\nprint(\"Suspensas:\", len([n for n in notas if n < 5]))", "Misma idea con la condición al revés."],
    ], t: "Media de notas", codigo: 'notas = [7, 5.5, 9, 4, 8]\n\nsuma = 0\nfor n in notas:\n    suma = suma + n\n\nmedia = suma / len(notas)\nprint("Media:", round(media, 2))\nprint("Máxima:", max(notas), "· Mínima:", min(notas))\nprint("Aprobadas:", len([n for n in notas if n >= 5]))\n', explica: [
      ["notas = [...]", "Una lista con 5 notas."],
      ["suma = 0 + for", "Empezamos en 0 y en cada vuelta del bucle sumamos una nota. Es lo que hace sum() por dentro."],
      ["len(notas)", "Cuántas notas hay (5), para dividir."],
      ["round(media, 2)", "Redondea a 2 decimales."],
      ["[n for n in notas if n >= 5]", "Una «lista por comprensión»: crea una lista solo con las aprobadas. len() las cuenta."],
    ] },
    { prueba: [
      ["Hasta 200", "range(1, 50)", "range(1, 200)", "Cambias el final del rango: busca primos hasta 199."],
      ["Quita el n < 2", "    if n < 2:\n        return False\n", "", "Ahora el 1 sale como primo (¡error!). Por eso hace falta esa comprobación."],
    ], t: "¿Es primo?", codigo: 'def es_primo(n):\n    if n < 2:\n        return False\n    for d in range(2, int(n ** 0.5) + 1):\n        if n % d == 0:\n            return False\n    return True\n\nprimos = [n for n in range(1, 50) if es_primo(n)]\nprint(primos)\n', explica: [
      ["def es_primo(n)", "Una función: recibe un número y devuelve True o False."],
      ["n < 2", "El 0 y el 1 no son primos."],
      ["range(2, √n + 1)", "Solo hace falta probar divisores hasta la raíz cuadrada: si hubiera uno mayor, habría otro menor."],
      ["n % d == 0", "Si el resto es 0, d divide a n → no es primo, y return sale de la función al momento."],
      ["return True", "Si ningún divisor ha funcionado, es primo."],
    ] },
    { prueba: [
      ["Busca a alguien que no está", "buscar = \"Marc\"", "buscar = \"Pepe\"", ".get devuelve «no está» en vez de dar error."],
      ["Ordénala", "for nombre, tel in agenda.items():", "for nombre, tel in sorted(agenda.items()):", "sorted ordena las parejas por nombre."],
    ], t: "Agenda con diccionario", codigo: 'agenda = {\n    "Ana": "600111222",\n    "Marc": "600333444",\n}\n\nagenda["Lorena"] = "600555666"   # añadir\n\nfor nombre, tel in agenda.items():\n    print(f"{nombre:<8} {tel}")\n\nbuscar = "Marc"\nprint(buscar, "→", agenda.get(buscar, "no está"))\n', explica: [
      ["{ clave: valor }", "Un diccionario guarda parejas: el nombre (clave) y su teléfono (valor)."],
      ["agenda[\"Lorena\"] = …", "Añade (o cambia) una entrada."],
      [".items()", "Da las parejas para recorrerlas con for nombre, tel."],
      ["{nombre:<8}", "Formato: alinea el texto a la izquierda en 8 huecos, para que quede en columna."],
      [".get(clave, \"no está\")", "Busca sin dar error si no existe."],
    ] },
    { prueba: [
      ["Prueba con /27", "192.168.10.37/26", "192.168.10.37/27", "Con un bit más de red, la subred es la mitad: 30 hosts."],
      ["Otra IP", "192.168.10.37/26", "10.20.30.200/22", "Funciona con cualquier red. Compáralo con la herramienta Subredes."],
    ], t: "Calculadora de subredes", codigo: 'import ipaddress\n\nred = ipaddress.ip_interface("192.168.10.37/26").network\n\nprint("Red:      ", red.network_address)\nprint("Máscara:  ", red.netmask)\nprint("Broadcast:", red.broadcast_address)\nhosts = list(red.hosts())\nprint("Hosts:    ", len(hosts), f"({hosts[0]} - {hosts[-1]})")\n', explica: [
      ["import ipaddress", "Python trae un módulo para trabajar con IPs."],
      ["ip_interface(…).network", "A partir de una IP con su /prefijo saca la red a la que pertenece."],
      ["network_address, netmask, broadcast_address", "Lo mismo que calculas a mano en el examen."],
      ["red.hosts()", "Todas las IPs usables. hosts[0] es la primera y hosts[-1] la última."],
    ] },
  ],
  chuleta: [
    { t: "Básico", filas: [["print(x)", "Mostrar"], ["x = input(\"?\")", "Pedir (texto)"], ["int(x) · float(x) · str(x)", "Convertir"], ["# comentario", "No se ejecuta"]] },
    { t: "Operadores", filas: [["+ - * /", "Operaciones"], ["// %", "División entera · resto"], ["**", "Potencia"], ["== != < > <= >=", "Comparar"], ["and or not", "Lógicos"]] },
    { t: "Control", filas: [["if x: … elif: … else:", "Condiciones"], ["for x in lista:", "Recorrer"], ["for i in range(1, 11):", "Del 1 al 10"], ["while cond:", "Mientras"], ["break · continue", "Salir · saltar vuelta"]] },
    { t: "Listas", filas: [["l = [1, 2]", "Crear"], ["l[0] · l[-1]", "Primero · último"], ["l.append(x)", "Añadir"], ["len(l) · sum(l)", "Cuántos · suma"], ["sorted(l)", "Ordenada"]] },
    { t: "Textos", filas: [["len(s)", "Longitud"], ["s.upper() · s.lower()", "Mayús · minús"], ["s.split(\",\")", "Partir"], ["f\"Hola {x}\"", "Meter variables"]] },
    { t: "Funciones", filas: [["def f(a, b):", "Definir"], ["return x", "Devolver"], ["try: … except: …", "Controlar errores"]] },
  ],
};

export const SQL = {
  ejemplos: [
    { t: "Ver todo", sql: "SELECT * FROM alumnos;", explica: [["SELECT *", "«Dame todas las columnas» (* = todas)."], ["FROM alumnos", "De la tabla alumnos."], [";", "Fin de la orden."]] },
    { prueba: [["Cambia AND por OR", "AND edad >= 18", "OR edad >= 18", "Ahora basta con cumplir una de las dos: salen más filas."], ["Otra ciudad", "'Barcelona'", "'Badalona'", "Cambias el valor que se busca."]], t: "Filtrar con WHERE", sql: "SELECT nombre, ciudad\nFROM alumnos\nWHERE ciudad = 'Barcelona' AND edad >= 18;", explica: [["SELECT nombre, ciudad", "Solo esas dos columnas."], ["WHERE …", "Solo las filas que cumplen la condición."], ["'Barcelona'", "Los textos van entre comillas simples."], ["AND", "Se tienen que cumplir las dos (OR = basta una)."]] },
    { prueba: [["Del más joven al mayor", "edad DESC", "edad ASC", "ASC = ascendente (de menor a mayor)."], ["Quita el LIMIT", "\nLIMIT 3;", ";", "Salen todas las filas."]], t: "Ordenar y limitar", sql: "SELECT nombre, edad\nFROM alumnos\nORDER BY edad DESC, nombre\nLIMIT 3;", explica: [["ORDER BY edad DESC", "Ordena por edad de mayor a menor (ASC = de menor a mayor, lo normal)."], [", nombre", "Si empatan en edad, por nombre."], ["LIMIT 3", "Solo las 3 primeras filas."]] },
    { prueba: [["Agrupa por ciudad", "grupo", "ciudad", "Cambia la columna en el SELECT y en el GROUP BY: lo que agrupas tiene que ser lo que muestras."]], t: "Contar y agrupar", sql: "SELECT grupo, COUNT(*) AS alumnos, ROUND(AVG(edad), 1) AS edad_media\nFROM alumnos\nGROUP BY grupo;", explica: [["COUNT(*)", "Cuenta filas."], ["AVG(edad)", "La media (también SUM, MIN, MAX)."], ["AS alumnos", "Le pone nombre a la columna del resultado."], ["GROUP BY grupo", "Hace un grupo por cada valor de grupo y calcula COUNT y AVG dentro de cada uno."]] },
    { prueba: [["Solo suspensos", "n.nota >= 5", "n.nota < 5", "Mismo JOIN, otra condición."], ["Solo Redes locales", "WHERE n.nota >= 5", "WHERE m.nombre = 'Redes locales'", "Filtras por una columna de otra tabla gracias al JOIN."]], t: "Unir tablas (JOIN)", sql: "SELECT a.nombre, m.nombre AS modulo, n.nota\nFROM notas n\nJOIN alumnos a ON a.id = n.alumno_id\nJOIN modulos m ON m.id = n.modulo_id\nWHERE n.nota >= 5\nORDER BY a.nombre;", explica: [["La idea", "La tabla notas solo tiene números (alumno_id, modulo_id). Con JOIN traemos el nombre de cada uno de su tabla."], ["n, a, m", "Alias: nombres cortos de las tablas para escribir menos."], ["ON a.id = n.alumno_id", "Cómo se relacionan: la clave ajena (alumno_id) apunta a la clave primaria (id)."], ["WHERE n.nota >= 5", "Solo aprobados."]] },
    { t: "Media por alumno", sql: "SELECT a.nombre, ROUND(AVG(n.nota), 2) AS media, COUNT(*) AS modulos\nFROM alumnos a\nJOIN notas n ON n.alumno_id = a.id\nGROUP BY a.id\nHAVING media >= 6\nORDER BY media DESC;", explica: [["JOIN + GROUP BY", "Une alumnos con sus notas y agrupa por alumno para sacar su media."], ["HAVING", "Es un WHERE pero para después de agrupar (WHERE no puede usar AVG)."]] },
    { t: "Añadir (INSERT)", sql: "INSERT INTO alumnos (nombre, apellido, grupo, edad, ciudad)\nVALUES ('Sara', 'Gil', 'SMX1', 17, 'Girona');\n\nSELECT * FROM alumnos WHERE nombre = 'Sara';", explica: [["INSERT INTO tabla (columnas)", "Dice en qué tabla y qué columnas vas a rellenar."], ["VALUES (…)", "Los valores, en el mismo orden."], ["id", "No se pone: es AUTOINCREMENT y se numera solo."]] },
    { t: "Cambiar (UPDATE)", sql: "UPDATE alumnos SET ciudad = 'Terrassa' WHERE nombre = 'Iker';\n\nSELECT nombre, ciudad FROM alumnos WHERE nombre = 'Iker';", explica: [["SET columna = valor", "Lo que cambias."], ["WHERE", "¡IMPRESCINDIBLE! Sin WHERE cambiaría TODAS las filas."]] },
    { t: "Borrar (DELETE)", sql: "DELETE FROM notas WHERE nota < 4;\n\nSELECT COUNT(*) AS notas_que_quedan FROM notas;", explica: [["DELETE FROM … WHERE", "Borra las filas que cumplen la condición. Sin WHERE borra todo."], ["Para volver atrás", "Pulsa «Base de datos de nuevo»."]] },
    { t: "Crear una tabla", sql: "CREATE TABLE equipos (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  nombre TEXT NOT NULL,\n  ip TEXT UNIQUE,\n  aula TEXT DEFAULT 'A1'\n);\n\nINSERT INTO equipos (nombre, ip) VALUES ('PC01', '192.168.1.11'), ('PC02', '192.168.1.12');\nSELECT * FROM equipos;", explica: [["PRIMARY KEY", "Identifica cada fila; no se repite."], ["NOT NULL", "Obligatorio."], ["UNIQUE", "No puede haber dos iguales."], ["DEFAULT", "Valor si no pones nada."], ["En MySQL", "Se escribe INT AUTO_INCREMENT y VARCHAR(50) en vez de TEXT."]] },
  ],
  chuleta: [
    { t: "Consultar", filas: [["SELECT col FROM t", "Leer"], ["WHERE cond", "Filtrar"], ["ORDER BY col DESC", "Ordenar"], ["LIMIT n", "Solo n filas"], ["DISTINCT", "Sin repetidos"], ["LIKE 'A%'", "Empieza por A"]] },
    { t: "Calcular", filas: [["COUNT(*) · SUM · AVG · MIN · MAX", "Funciones"], ["GROUP BY col", "Agrupar"], ["HAVING cond", "Filtrar grupos"]] },
    { t: "Unir", filas: [["JOIN t2 ON t1.id = t2.t1_id", "Solo si coinciden"], ["LEFT JOIN", "Todos los de la izquierda"]] },
    { t: "Modificar", filas: [["INSERT INTO t (a,b) VALUES (1,2)", "Añadir"], ["UPDATE t SET a=1 WHERE …", "Cambiar"], ["DELETE FROM t WHERE …", "Borrar"]] },
    { t: "Estructura", filas: [["CREATE TABLE t (…)", "Crear"], ["ALTER TABLE t ADD col TEXT", "Añadir columna"], ["DROP TABLE t", "Borrar tabla"], ["PRIMARY KEY · FOREIGN KEY", "Claves"]] },
  ],
};

export const WEB = {
  ejemplos: [
    { prueba: [
      ["Cambia el color de la cabecera", "background: #0e7490", "background: #be123c", "El color de fondo del <header> pasa a rojo: en CSS los colores se escriben en hexadecimal (#rrggbb)."],
      ["Añade un módulo a la lista", "    <li>Seguridad informática</li>\n", "    <li>Seguridad informática</li>\n    <li>Servicios en red</li>\n", "Cada <li> es un elemento más de la lista <ul>."],
      ["Quita los puntos de la lista", "li { margin: 4px 0; }", "li { margin: 4px 0; }\nul { list-style: none; padding: 0; }", "list-style: none quita las viñetas."],
      ["Letra más grande", "body { font-family: system-ui, sans-serif; margin: 0; }", "body { font-family: system-ui, sans-serif; margin: 0; font-size: 22px; }", "font-size en el body lo heredan todos los hijos."],
    ], t: "Página básica", html: '<header>\n  <h1>Mochila SMX</h1>\n  <nav><a href="#">Inicio</a> · <a href="#">Apuntes</a></nav>\n</header>\n<main>\n  <h2>Mis módulos</h2>\n  <ul>\n    <li>Redes locales</li>\n    <li>Sistemas operativos en red</li>\n    <li>Seguridad informática</li>\n  </ul>\n  <img src="https://picsum.photos/300/120" alt="Foto de ejemplo">\n</main>\n', css: 'body { font-family: system-ui, sans-serif; margin: 0; }\nheader { background: #0e7490; color: white; padding: 16px; }\nheader a { color: #cffafe; }\nmain { padding: 16px; }\nli { margin: 4px 0; }\nimg { border-radius: 12px; max-width: 100%; }\n', js: "", explica: [
      ["HTML = estructura", "Las etiquetas dicen QUÉ es cada cosa: <header> la cabecera, <nav> el menú, <main> el contenido, <ul>/<li> una lista."],
      ["CSS = aspecto", "Cada regla tiene un selector (a quién) y propiedades (cómo): header { background: … }."],
      ["alt en la imagen", "Texto alternativo: obligatorio por accesibilidad."],
      ["Pruébalo", "Cambia el color de background en CSS y pulsa Ejecutar."],
    ] },
    { prueba: [
      ["Que sume de 5 en 5", "contador++;", "contador += 5;", "contador++ es lo mismo que contador = contador + 1. Con += 5 suma 5."],
      ["Que se ponga rojo al pasar de 10", "  num.textContent = contador;\n  console.log", "  num.textContent = contador;\n  num.style.color = contador > 10 ? \"red\" : \"black\";\n  console.log", "El operador ? : es un if corto: si contador > 10, rojo; si no, negro."],
      ["Botón redondo", "border-radius: 8px;", "border-radius: 999px;", "Un radio muy grande deja los extremos totalmente redondos."],
    ], t: "Botón que cuenta", html: '<h1>Contador</h1>\n<p>Has pulsado <b id="num">0</b> veces</p>\n<button id="mas">Sumar 1</button>\n<button id="reset">Reiniciar</button>\n', css: 'body { font-family: system-ui; text-align: center; padding: 20px; }\nbutton { font-size: 18px; padding: 8px 16px; border-radius: 8px; border: 0; background: #0e7490; color: white; }\n#reset { background: #64748b; }\n', js: 'let contador = 0;\nconst num = document.getElementById("num");\n\ndocument.getElementById("mas").addEventListener("click", () => {\n  contador++;\n  num.textContent = contador;\n  console.log("Contador:", contador);\n});\n\ndocument.getElementById("reset").addEventListener("click", () => {\n  contador = 0;\n  num.textContent = 0;\n});\n', explica: [
      ["id en el HTML", "id=\"num\" le da un nombre único al elemento para encontrarlo desde JavaScript."],
      ["let contador = 0", "Una variable que cambia (let). const es para las que no cambian."],
      ["getElementById", "JavaScript busca el elemento de la página por su id."],
      ["addEventListener(\"click\", …)", "«Cuando hagan clic, ejecuta esta función»."],
      ["textContent", "Cambia el texto que se ve."],
      ["console.log", "Escribe en la consola: sirve para comprobar qué pasa por dentro."],
    ] },
    { prueba: [
      ["Cambia flex por grid", "display: flex;\n  flex-wrap: wrap;", "display: grid;\n  grid-template-columns: repeat(3, 1fr);", "Con grid defines columnas: 3 columnas iguales (1fr = una parte del espacio)."],
      ["Todas en columna", "flex-wrap: wrap;", "flex-direction: column;", "flex-direction: column pone los hijos uno debajo de otro."],
      ["Más separación", "gap: 12px;", "gap: 40px;", "gap es el espacio entre elementos del flex o grid."],
      ["Tarjetas oscuras", "background: #f1f5f9;", "background: #1e293b;\n  color: white;", "Fondo oscuro y letra blanca para que se lea."],
    ], t: "Tarjetas con Flexbox", html: '<div class="tarjetas">\n  <div class="tarjeta"><h3>Redes</h3><p>Subnetting y VLAN</p></div>\n  <div class="tarjeta"><h3>Sistemas</h3><p>Windows Server</p></div>\n  <div class="tarjeta"><h3>Seguridad</h3><p>Copias y cifrado</p></div>\n</div>\n', css: '.tarjetas {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  padding: 12px;\n}\n.tarjeta {\n  flex: 1 1 140px;\n  background: #f1f5f9;\n  border-radius: 12px;\n  padding: 12px;\n  box-shadow: 0 2px 6px rgba(0,0,0,.1);\n}\n.tarjeta:hover { transform: scale(1.03); transition: .2s; }\n', js: "", explica: [
      ["display: flex", "Pone los hijos (las tarjetas) en fila."],
      ["flex-wrap: wrap", "Si no caben, bajan a la siguiente línea (así se adapta al móvil)."],
      ["gap", "Espacio entre tarjetas."],
      ["flex: 1 1 140px", "Crecen para llenar el hueco, encogen si hace falta y miden al menos 140px."],
      [":hover", "Estilo cuando pasas el ratón por encima."],
    ] },
    { prueba: [
      ["Mensaje en verde", "#mensaje { font-weight: bold; }", "#mensaje { font-weight: bold; color: green; }", "El selector #mensaje apunta al elemento con id=\"mensaje\"."],
      ["Cambia la edad mínima", "if (edad < 18)", "if (edad < 21)", "Cambias la condición: ahora hasta los 20 pide permiso."],
      ["Quita el preventDefault", "  e.preventDefault(); // que no recargue la página\n", "", "Al enviar, la página se recarga y se pierde el mensaje: por eso se pone preventDefault."],
    ], t: "Formulario que comprueba", html: '<form id="form">\n  <label>Correo <input id="correo" type="email" required></label>\n  <label>Edad <input id="edad" type="number" min="16" required></label>\n  <button>Enviar</button>\n</form>\n<p id="mensaje"></p>\n', css: 'form { display: grid; gap: 10px; max-width: 260px; font-family: system-ui; }\ninput { display: block; width: 100%; padding: 6px; }\n#mensaje { font-weight: bold; }\n', js: 'document.getElementById("form").addEventListener("submit", (e) => {\n  e.preventDefault(); // que no recargue la página\n  const correo = document.getElementById("correo").value;\n  const edad = Number(document.getElementById("edad").value);\n  const msg = document.getElementById("mensaje");\n  if (edad < 18) {\n    msg.textContent = "Necesitas permiso de tus padres";\n  } else {\n    msg.textContent = "¡Gracias! Te escribiremos a " + correo;\n  }\n  console.log({ correo, edad });\n});\n', explica: [
      ["type=\"email\" y required", "El propio navegador comprueba que sea un correo y que no esté vacío."],
      ["submit", "El evento que salta al enviar el formulario."],
      ["e.preventDefault()", "Evita que la página se recargue (lo que haría un formulario normal)."],
      [".value", "Lo que ha escrito el usuario. Siempre es texto: Number() lo pasa a número."],
      ["if / else", "Decide qué mensaje mostrar."],
    ] },
  ],
  chuleta: [
    { t: "HTML", filas: [["<h1>…<h6>", "Títulos"], ["<p> · <br>", "Párrafo · salto"], ["<a href=\"url\">", "Enlace"], ["<img src alt>", "Imagen"], ["<ul><li>", "Lista"], ["<div> · <span>", "Cajas genéricas"], ["<form> <input> <button>", "Formulario"], ["id=\"x\" · class=\"x\"", "Nombre único · grupo"]] },
    { t: "CSS", filas: [["color · background", "Colores"], ["font-size · font-family", "Letra"], ["margin · padding", "Espacio fuera · dentro"], ["border · border-radius", "Borde · redondeo"], ["display: flex · grid", "Colocar"], ["#id · .clase · etiqueta", "Selectores"], ["@media (max-width: 600px)", "Móvil"]] },
    { t: "JavaScript", filas: [["let x = 1 · const y = 2", "Variables"], ["console.log(x)", "Ver en la consola"], ["document.getElementById(\"x\")", "Buscar elemento"], ["el.textContent = \"…\"", "Cambiar texto"], ["el.addEventListener(\"click\", f)", "Al hacer clic"], ["if (…) { } else { }", "Condición"], ["for (let i = 0; i < 5; i++) { }", "Bucle"]] },
  ],
};
