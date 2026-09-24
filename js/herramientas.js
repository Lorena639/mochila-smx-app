// =============================================================
//  herramientas.js — Caja de herramientas SMX (funciona sin internet)
//   · Calculadora de subredes IPv4 (con los pasos explicados)
//   · Conversor binario / decimal / hexadecimal
//   · Chuletas: Linux, Windows, Cisco IOS y puertos
//   · Y el resto: herr-redes, herr-sistemas, herr-seguridad,
//     herr-hardware y biblioteca (programación)
//   · herr-guias (qué es / cuándo) y herr-pasos (cómo se ha hecho)
// =============================================================
import { esc, normalizar, nuevoId, hoyIso } from "./comun.js";
import { limpiar } from "./editor.js";
import { icono } from "./iconos.js";
import * as Redes from "./herr-redes.js";
import * as Sis from "./herr-sistemas.js";
import * as Seg from "./herr-seguridad.js";
import * as Hw from "./herr-hardware.js";
import * as Biblio from "./biblioteca.js";
import { GUIAS, NIVELES } from "./herr-guias.js";
import { PASOS } from "./herr-pasos.js";
import * as Extra from "./herr-extra.js";

// ---------- Subredes ----------
const aNum = (ip) => ip.split(".").reduce((a, o) => (a << 8) + Number(o), 0) >>> 0;
const aIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
const bin8 = (n) => n.toString(2).padStart(8, "0");
const aBin = (n) => [24, 16, 8, 0].map((s) => bin8((n >>> s) & 255)).join(".");
const ipValida = (ip) => /^(\d{1,3})(\.\d{1,3}){3}$/.test(ip) && ip.split(".").every((o) => Number(o) <= 255);

export function calcularSubred(entrada, mascaraTxt = "") {
  let [ip, pref] = String(entrada).trim().split("/");
  ip = (ip || "").trim();
  if (!ipValida(ip)) throw new Error("Escribe una IP válida, por ejemplo 192.168.10.37/26");
  let cidr;
  if (pref !== undefined && pref !== "") cidr = Number(pref);
  else if (mascaraTxt) {
    if (!ipValida(mascaraTxt)) throw new Error("La máscara no es válida.");
    const m = aNum(mascaraTxt);
    const b = m.toString(2).padStart(32, "0");
    if (!/^1*0*$/.test(b)) throw new Error("La máscara no es válida: los 1 tienen que ir seguidos.");
    cidr = b.indexOf("0") === -1 ? 32 : b.indexOf("0");
  } else throw new Error("Añade el prefijo (/24) o la máscara.");
  if (!(cidr >= 0 && cidr <= 32)) throw new Error("El prefijo tiene que estar entre /0 y /32.");
  const n = aNum(ip);
  const mask = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
  const red = (n & mask) >>> 0;
  const broadcast = (red | (~mask >>> 0)) >>> 0;
  const total = 2 ** (32 - cidr);
  const hosts = cidr >= 31 ? (cidr === 31 ? 2 : 1) : total - 2;
  const primero = cidr >= 31 ? red : red + 1;
  const ultimo = cidr >= 31 ? broadcast : broadcast - 1;
  const o1 = n >>> 24;
  const clase = o1 < 128 ? "A" : o1 < 192 ? "B" : o1 < 224 ? "C" : o1 < 240 ? "D (multicast)" : "E (experimental)";
  const privada = o1 === 10 || (o1 === 172 && ((n >>> 16) & 255) >= 16 && ((n >>> 16) & 255) <= 31) || (o1 === 192 && ((n >>> 16) & 255) === 168);
  return { ip, cidr, mascara: aIp(mask), wildcard: aIp(~mask >>> 0), red: aIp(red), broadcast: aIp(broadcast), primero: aIp(primero), ultimo: aIp(ultimo),
    hosts, total, clase, privada: privada ? "Privada (RFC 1918)" : o1 === 127 ? "Loopback" : o1 === 169 && ((n >>> 16) & 255) === 254 ? "APIPA (link-local)" : "Pública",
    binIp: aBin(n), binMask: aBin(mask), binRed: aBin(red), binBroad: aBin(broadcast) };
}

function htmlSubred(e) {
  const t = e.herr || {};
  let r = null, error = "";
  try { if (t.subred) r = calcularSubred(t.subred, t.mascara); } catch (err) { error = err.message; }
  const fila = (k, v, mono = true) => `<div class="res-fila"><span>${k}</span><b class="${mono ? "mono" : ""}">${esc(String(v))}</b></div>`;
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("red")} Calculadora de subredes IPv4</h2></div>
    <div class="rejilla-form">
      <div class="campo"><label for="hSub">IP con prefijo</label><input id="hSub" class="mono" data-herr="subred" value="${esc(t.subred || "")}" placeholder="192.168.10.37/26" autocomplete="off" spellcheck="false"></div>
      <div class="campo"><label for="hMask">o máscara (si no pones /prefijo)</label><input id="hMask" class="mono" data-herr="mascara" value="${esc(t.mascara || "")}" placeholder="255.255.255.192" autocomplete="off"></div>
    </div>
    ${error ? `<p class="error">${esc(error)}</p>` : ""}
    ${r ? `<div class="resultado-red">
        ${fila("Dirección de red", `${r.red}/${r.cidr}`)}${fila("Máscara", r.mascara)}${fila("Wildcard (ACL / OSPF)", r.wildcard)}
        ${fila("Primer host", r.primero)}${fila("Último host", r.ultimo)}${fila("Broadcast", r.broadcast)}
        ${fila("Hosts utilizables", r.hosts.toLocaleString("es-ES"), false)}${fila("Clase / tipo", `${r.clase} · ${r.privada}`, false)}
      </div>
      <details class="pasos" open><summary>Cómo se calcula (paso a paso)</summary>
        <ol>
          <li>Pasa la IP y la máscara a binario:<pre>IP       ${r.binIp}\nMáscara  ${r.binMask}</pre></li>
          <li>La <b>red</b> es IP AND máscara (donde la máscara tiene 0, se ponen 0):<pre>Red      ${r.binRed}  = ${r.red}</pre></li>
          <li>El <b>broadcast</b> es la red con todos los bits de host a 1:<pre>Broadcast ${r.binBroad} = ${r.broadcast}</pre></li>
          <li>Bits de host: 32 − ${r.cidr} = <b>${32 - r.cidr}</b> → 2<sup>${32 - r.cidr}</sup> = ${r.total.toLocaleString("es-ES")} direcciones${r.cidr < 31 ? `, menos red y broadcast = <b>${r.hosts.toLocaleString("es-ES")} hosts</b>` : ""}.</li>
          <li>Primer host = red + 1 · último host = broadcast − 1.</li>
        </ol></details>` : `<p class="texto-suave">Prueba con la IP de tu práctica. Acepta 10.0.0.5/8, 172.16.4.1/20, 192.168.1.130 con máscara…</p>`}
  </section>`;
}

// ---------- Conversor ----------
function htmlConversor(e) {
  const t = e.herr || {};
  const base = t.base || "10";
  let n = null;
  const v = String(t.valor || "").trim().replace(/\s|\./g, "");
  if (v) {
    const ok = { 2: /^[01]+$/, 10: /^\d+$/, 16: /^[0-9a-f]+$/i, 8: /^[0-7]+$/ }[base].test(v);
    n = ok ? parseInt(v, Number(base)) : NaN;
  }
  const bin = n !== null && !isNaN(n) ? n.toString(2) : "";
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("terminal")} Conversor de bases</h2></div>
    <div class="rejilla-form">
      <div class="campo"><label for="hVal">Número</label><input id="hVal" class="mono" data-herr="valor" value="${esc(t.valor || "")}" placeholder="p. ej. 192" autocomplete="off"></div>
      <div class="campo"><label for="hBase">Está en</label><select id="hBase" data-herr="base">${[["10", "Decimal"], ["2", "Binario"], ["16", "Hexadecimal"], ["8", "Octal"]].map(([b, t2]) => `<option value="${b}" ${base === b ? "selected" : ""}>${t2}</option>`).join("")}</select></div>
    </div>
    ${n === null ? "" : isNaN(n) ? `<p class="error">Ese número no es válido en esa base.</p>` : `<div class="resultado-red">
      <div class="res-fila"><span>Decimal</span><b class="mono">${n}</b></div>
      <div class="res-fila"><span>Binario</span><b class="mono">${bin.padStart(Math.ceil(bin.length / 8) * 8, "0").replace(/(.{4})(?=.)/g, "$1 ")}</b></div>
      <div class="res-fila"><span>Hexadecimal</span><b class="mono">0x${n.toString(16).toUpperCase()}</b></div>
      <div class="res-fila"><span>Octal</span><b class="mono">${n.toString(8)}</b></div>
      ${n <= 255 ? `<div class="res-fila"><span>Pesos (octeto)</span><b class="mono">${[128, 64, 32, 16, 8, 4, 2, 1].map((p) => (n & p ? p : "·")).join(" ")}</b></div>` : ""}
    </div>`}
  </section>`;
}

// ---------- Chuletas ----------
const L = (cmd, desc) => ({ cmd, desc });
export const CHULETAS = {
  linux: { nombre: "Linux", items: [
    L("ls -la", "Lista archivos, incluidos los ocultos, con permisos"), L("cd /ruta", "Cambia de directorio"), L("pwd", "Muestra el directorio actual"),
    L("mkdir -p a/b", "Crea directorios (y los padres si faltan)"), L("cp -r origen destino", "Copia archivos o carpetas"), L("mv origen destino", "Mueve o renombra"),
    L("rm -r carpeta", "Borra una carpeta con su contenido"), L("cat / less archivo", "Muestra el contenido de un archivo"), L("nano archivo", "Editor de texto sencillo"),
    L("grep -ri texto /ruta", "Busca texto dentro de archivos"), L("find / -name nombre", "Busca archivos por nombre"), L("chmod 755 archivo", "Cambia permisos (rwx r-x r-x)"),
    L("chown usuario:grupo archivo", "Cambia propietario y grupo"), L("sudo comando", "Ejecuta como administrador"), L("useradd -m -s /bin/bash usu", "Crea un usuario con carpeta personal"),
    L("passwd usuario", "Cambia la contraseña"), L("usermod -aG grupo usuario", "Añade un usuario a un grupo"), L("groupadd grupo", "Crea un grupo"),
    L("ip a", "Muestra interfaces y direcciones IP"), L("ip r", "Muestra la tabla de rutas"), L("ping -c 4 host", "Comprueba conectividad"),
    L("ss -tulpn", "Puertos abiertos y qué proceso los usa"), L("dig dominio / nslookup", "Consulta DNS"), L("traceroute host", "Ruta de saltos hasta un destino"),
    L("sudo apt update && sudo apt upgrade", "Actualiza el sistema (Debian/Ubuntu)"), L("sudo apt install paquete", "Instala un paquete"),
    L("systemctl status servicio", "Estado de un servicio"), L("systemctl restart|enable servicio", "Reinicia o activa al arrancar"), L("journalctl -u servicio -f", "Registro de un servicio en directo"),
    L("df -h / du -sh carpeta", "Espacio en disco / tamaño de una carpeta"), L("free -h", "Memoria RAM usada"), L("top / htop", "Procesos en tiempo real"),
    L("ps aux | grep nombre", "Busca un proceso"), L("kill -9 PID", "Mata un proceso"), L("tar -czvf copia.tar.gz carpeta", "Comprime una carpeta"),
    L("tar -xzvf copia.tar.gz", "Descomprime"), L("ssh usuario@ip", "Conexión remota segura"), L("scp archivo usu@ip:/ruta", "Copia archivos por SSH"),
    L("netplan apply", "Aplica la configuración de red (Ubuntu)"), L("ufw allow 22/tcp / ufw enable", "Cortafuegos sencillo"), L("crontab -e", "Programa tareas periódicas"),
    L("mount /dev/sdb1 /mnt", "Monta un disco"), L("lsblk / fdisk -l", "Lista discos y particiones"),
  ] },
  windows: { nombre: "Windows", items: [
    L("ipconfig /all", "Configuración de red completa"), L("ipconfig /release · /renew", "Suelta y pide IP al DHCP"), L("ipconfig /flushdns", "Vacía la caché DNS"),
    L("ping -t host", "Ping continuo (Ctrl+C para parar)"), L("tracert host", "Ruta de saltos"), L("nslookup dominio", "Consulta DNS"),
    L("netstat -ano", "Conexiones y puertos con su PID"), L("arp -a", "Tabla ARP (IP ↔ MAC)"), L("route print", "Tabla de rutas"),
    L("hostname / whoami", "Nombre del equipo / usuario actual"), L("systeminfo", "Información del sistema"), L("tasklist / taskkill /PID n /F", "Lista y cierra procesos"),
    L("sfc /scannow", "Repara archivos del sistema"), L("DISM /Online /Cleanup-Image /RestoreHealth", "Repara la imagen de Windows"), L("chkdsk C: /f", "Revisa y repara el disco"),
    L("gpupdate /force", "Aplica las directivas de grupo"), L("gpresult /r", "Directivas aplicadas al usuario/equipo"), L("net user usuario clave /add", "Crea un usuario local"),
    L("net localgroup Administradores usu /add", "Añade a administradores"), L("net share", "Carpetas compartidas"), L("net use Z: \\\\servidor\\carpeta", "Conecta una unidad de red"),
    L("shutdown /r /t 0", "Reinicia ya"), L("Get-NetIPAddress", "PowerShell: direcciones IP"), L("Test-NetConnection host -Port 443", "PowerShell: prueba un puerto"),
    L("Get-Service / Restart-Service nombre", "PowerShell: servicios"), L("Get-ADUser -Filter *", "PowerShell: usuarios del dominio"), L("New-ADUser -Name \"Nom\"", "PowerShell: crea usuario en AD"),
    L("Get-Process | Sort CPU -Desc", "PowerShell: procesos que más gastan"), L("dsa.msc · gpmc.msc · dnsmgmt.msc · dhcpmgmt.msc", "Consolas de AD, GPO, DNS y DHCP"),
    L("services.msc · eventvwr · compmgmt.msc", "Servicios, visor de eventos, administración de equipos"),
  ] },
  cisco: { nombre: "Cisco IOS", items: [
    L("enable", "Modo privilegiado (Router#)"), L("configure terminal", "Modo configuración global"), L("hostname R1", "Cambia el nombre"),
    L("enable secret clave", "Contraseña del modo privilegiado (cifrada)"), L("service password-encryption", "Cifra las contraseñas en la config"), L("banner motd #texto#", "Mensaje de aviso"),
    L("line console 0 → password x → login", "Contraseña de consola"), L("line vty 0 4 → transport input ssh", "Solo acceso remoto por SSH"),
    L("ip domain-name smx.local → crypto key generate rsa", "Prepara SSH (clave 1024 o más)"), L("username admin secret clave", "Usuario local"),
    L("interface g0/0", "Entra en una interfaz"), L("ip address 192.168.1.1 255.255.255.0", "Asigna IP a la interfaz"), L("no shutdown", "Enciende la interfaz"),
    L("description Enlace a SW1", "Describe la interfaz"), L("ip route 0.0.0.0 0.0.0.0 10.0.0.1", "Ruta por defecto"), L("ip route red máscara siguiente-salto", "Ruta estática"),
    L("router ospf 1 → network 10.0.0.0 0.0.0.255 area 0", "OSPF básico"), L("vlan 10 → name ALUMNOS", "Crea una VLAN (switch)"),
    L("switchport mode access → switchport access vlan 10", "Puerto de acceso a una VLAN"), L("switchport mode trunk", "Puerto troncal"),
    L("interface g0/0.10 → encapsulation dot1Q 10", "Subinterfaz router-on-a-stick"), L("ip dhcp pool LAN → network … → default-router …", "Servidor DHCP en el router"),
    L("ip dhcp excluded-address 192.168.1.1 192.168.1.10", "Excluye IP del DHCP"), L("ip nat inside / ip nat outside", "Marca interfaces para NAT"),
    L("ip nat inside source list 1 interface g0/1 overload", "PAT (NAT con sobrecarga)"), L("access-list 1 permit 192.168.1.0 0.0.0.255", "ACL estándar"),
    L("show running-config", "Configuración actual"), L("show ip interface brief", "Resumen de interfaces e IP"), L("show ip route", "Tabla de rutas"),
    L("show vlan brief", "VLAN y sus puertos"), L("show interfaces trunk", "Troncales"), L("show cdp neighbors", "Equipos vecinos"),
    L("copy running-config startup-config", "Guarda la configuración (o: write)"), L("reload", "Reinicia el equipo"),
  ] },
  powershell: { nombre: "PowerShell", items: [
    L("Get-Help comando -Examples", "Ayuda con ejemplos de cualquier comando"), L("Get-Command *red*", "Busca comandos por nombre"),
    L("Get-ChildItem (ls, dir)", "Lista archivos y carpetas"), L("Set-Location C:\\ (cd)", "Cambia de carpeta"),
    L("New-Item -ItemType Directory Nombre", "Crea una carpeta"), L("Copy-Item / Move-Item / Remove-Item", "Copiar, mover y borrar"),
    L("Get-Content archivo.txt", "Muestra el contenido de un archivo"), L("Get-Process | Sort-Object CPU -Descending", "Procesos que más gastan"),
    L("Stop-Process -Name notepad", "Cierra un programa"), L("Get-Service | Where Status -eq Running", "Servicios en marcha"),
    L("Restart-Service Spooler", "Reinicia un servicio (la cola de impresión)"), L("Get-NetIPConfiguration", "Configuración de red"),
    L("Test-Connection 8.8.8.8", "Ping en PowerShell"), L("Test-NetConnection web.com -Port 443", "Comprueba si un puerto responde"),
    L("New-NetIPAddress -InterfaceAlias Ethernet -IPAddress 192.168.1.10 -PrefixLength 24 -DefaultGateway 192.168.1.1", "Pone una IP fija"),
    L("Set-DnsClientServerAddress -InterfaceAlias Ethernet -ServerAddresses 8.8.8.8", "Cambia el DNS"),
    L("Get-LocalUser / New-LocalUser Ana", "Usuarios locales"), L("Add-LocalGroupMember -Group Administradores -Member Ana", "Hace a un usuario administrador"),
    L("Rename-Computer -NewName PC01 -Restart", "Cambia el nombre del equipo"), L("Get-ComputerInfo", "Información completa del equipo"),
    L("Set-ExecutionPolicy RemoteSigned", "Permite ejecutar tus propios scripts .ps1"),
  ] },
  winserver: { nombre: "Windows Server / AD", items: [
    L("Install-WindowsFeature AD-Domain-Services -IncludeManagementTools", "Instala el rol de Active Directory"),
    L("Install-ADDSForest -DomainName smx.local", "Crea un dominio nuevo (promociona a controlador de dominio)"),
    L("Add-Computer -DomainName smx.local -Restart", "Une un equipo cliente al dominio"),
    L("New-ADOrganizationalUnit -Name Alumnos", "Crea una unidad organizativa (OU)"),
    L("New-ADUser -Name \"Ana Pérez\" -SamAccountName ana -Path \"OU=Alumnos,DC=smx,DC=local\" -Enabled $true -AccountPassword (Read-Host -AsSecureString)", "Crea un usuario del dominio"),
    L("New-ADGroup -Name 2SMX -GroupScope Global", "Crea un grupo"), L("Add-ADGroupMember 2SMX -Members ana", "Mete un usuario en un grupo"),
    L("Get-ADUser -Filter * | Select Name", "Lista los usuarios del dominio"), L("Unlock-ADAccount ana", "Desbloquea una cuenta"),
    L("Install-WindowsFeature DHCP -IncludeManagementTools", "Instala el servidor DHCP"), L("Install-WindowsFeature DNS", "Instala el servidor DNS"),
    L("gpupdate /force", "Aplica las GPO ya"), L("gpresult /r", "Qué GPO se aplican"),
    L("dsa.msc", "Usuarios y equipos de Active Directory"), L("gpmc.msc", "Administración de directivas de grupo (GPO)"),
    L("dnsmgmt.msc · dhcpmgmt.msc", "Consolas de DNS y DHCP"), L("servermanager", "Administrador del servidor"),
    L("Recurso compartido: \\\\servidor\\carpeta", "Ruta de red para compartir carpetas"),
  ] },
  packet: { nombre: "Packet Tracer", items: [
    L("Cable negro continuo", "Directo (straight-through): PC ↔ switch, switch ↔ router"), L("Cable negro discontinuo", "Cruzado (crossover): equipos iguales"),
    L("Cable azul claro", "Consola: para configurar un router/switch desde un PC (Terminal)"), L("Cable rojo en zigzag", "Serie (entre routers, WAN)"),
    L("Rayo naranja", "Conexión automática: Packet Tracer elige el cable"), L("Punto verde / naranja / rojo", "Enlace activo / arrancando / apagado"),
    L("PC → Desktop → IP Configuration", "Poner IP, máscara, gateway y DNS a mano o por DHCP"), L("PC → Desktop → Command Prompt", "ping, ipconfig, tracert…"),
    L("Router → pestaña CLI", "Consola para escribir comandos Cisco"), L("Modo Simulation (abajo a la derecha)", "Ver los paquetes viajar paso a paso"),
    L("Módulos (router apagado)", "Para añadir tarjetas (p. ej. HWIC-2T) hay que apagar el equipo"), L("Ctrl+S", "Guardar el .pkt (hazlo a menudo)"),
  ] },
  virtualbox: { nombre: "VirtualBox", items: [
    L("Adaptador puente (Bridged)", "La VM sale a tu red como un equipo más (IP del router de clase)"),
    L("NAT", "La VM tiene internet pero no se ve desde fuera"), L("Red interna", "Las VM se ven entre ellas, sin internet ni tu PC"),
    L("Solo anfitrión (Host-only)", "La VM solo se ve con tu PC"), L("Red NAT", "Varias VM juntas con internet"),
    L("Instantánea (Snapshot)", "Guardar el estado para volver atrás si algo sale mal"), L("Clonar → Reinicializar MAC", "Copiar una VM sin que choquen las MAC"),
    L("Insertar imagen de Guest Additions", "Pantalla completa, portapapeles compartido y carpetas compartidas"),
    L("Ctrl derecho", "Tecla anfitrión: suelta el ratón de la VM"), L("Ctrl derecho + F", "Pantalla completa"),
    L("Configuración → Sistema → Orden de arranque", "Arrancar desde la ISO para instalar"),
  ] },
  atajos: { nombre: "Atajos de teclado", items: [
    L("Win + E", "Explorador de archivos"), L("Win + R", "Ejecutar (cmd, services.msc, control…)"), L("Win + X", "Menú de administración"),
    L("Win + L", "Bloquear el equipo (hazlo siempre al levantarte)"), L("Win + D", "Mostrar el escritorio"), L("Win + V", "Historial del portapapeles"),
    L("Win + Shift + S", "Captura de una parte de la pantalla"), L("Ctrl + Shift + Esc", "Administrador de tareas"), L("Alt + Tab", "Cambiar de ventana"),
    L("Ctrl + Z / Ctrl + Y", "Deshacer / rehacer"), L("F2", "Cambiar el nombre de un archivo"), L("Ctrl + Alt + T", "Terminal (Ubuntu)"),
    L("Tab (en terminal)", "Autocompletar comandos y rutas"), L("Ctrl + C (en terminal)", "Parar el comando que está en marcha"), L("Flecha arriba (en terminal)", "Repetir comandos anteriores"),
  ] },
  puertos: { nombre: "Puertos", items: [
    L("20/21 TCP", "FTP (datos / control)"), L("22 TCP", "SSH, SCP, SFTP"), L("23 TCP", "Telnet (inseguro)"), L("25 TCP", "SMTP (envío de correo)"),
    L("53 UDP/TCP", "DNS"), L("67/68 UDP", "DHCP (servidor / cliente)"), L("69 UDP", "TFTP"), L("80 TCP", "HTTP"), L("110 TCP", "POP3"),
    L("123 UDP", "NTP (hora)"), L("137-139", "NetBIOS"), L("143 TCP", "IMAP"), L("161/162 UDP", "SNMP / traps"), L("389 TCP", "LDAP"),
    L("443 TCP", "HTTPS"), L("445 TCP", "SMB (carpetas compartidas de Windows)"), L("465/587 TCP", "SMTP seguro / envío autenticado"), L("514 UDP", "Syslog"),
    L("636 TCP", "LDAPS"), L("993 TCP", "IMAPS"), L("995 TCP", "POP3S"), L("1194 UDP", "OpenVPN"), L("1433 TCP", "SQL Server"),
    L("3306 TCP", "MySQL / MariaDB"), L("3389 TCP", "Escritorio remoto (RDP)"), L("5432 TCP", "PostgreSQL"), L("8080 TCP", "HTTP alternativo / proxy"),
  ] },
};

function htmlChuletas(e) {
  const t = e.herr || {};
  const cat = t.cat || "linux";
  const q = normalizar(t.buscar || "");
  const items = (q ? Object.values(CHULETAS).flatMap((c) => c.items.map((x) => ({ ...x, cat: c.nombre }))) : CHULETAS[cat].items)
    .filter((x) => !q || normalizar(`${x.cmd} ${x.desc}`).includes(q));
  return `<section class="panel"><div class="panel-titulo"><h2>${icono("materias")} Chuletas</h2></div>
    <div class="filtros"><label class="buscador">${icono("buscar")}<input type="search" data-herr="buscar" value="${esc(t.buscar || "")}" placeholder="Buscar comando o puerto…" aria-label="Buscar en las chuletas"></label>
      ${Object.entries(CHULETAS).map(([id, c]) => `<button type="button" class="chip" aria-pressed="${!q && cat === id}" data-accion="herr-cat" data-cat="${id}">${c.nombre}</button>`).join("")}</div>
    <div class="chuletas">${items.map((x) => `<div class="chuleta"><code>${esc(x.cmd)}</code><span>${esc(x.desc)}${x.cat ? ` <small class="texto-suave">· ${esc(x.cat)}</small>` : ""}</span></div>`).join("") || `<p class="texto-suave">Nada coincide.</p>`}</div>
  </section>`;
}

// ---------- Todas las herramientas ----------
const BASE = [
  { id: "subredes", t: "Subredes IPv4", grupo: "Redes", desc: "Red, broadcast, hosts, paso a paso", html: htmlSubred },
  { id: "conversor", t: "Conversor de bases", grupo: "Referencia", desc: "Binario, decimal, hexadecimal", html: htmlConversor },
  { id: "chuletas", t: "Chuletas de comandos", grupo: "Referencia", desc: "Linux, Windows, Cisco y puertos", html: htmlChuletas },
  { id: "biblioteca", t: "Biblioteca de programación", grupo: "Referencia", desc: "HTML, CSS, JS, Python, SQL, Linux, Windows, Git…", html: (e) => Biblio.vistaBiblioteca(e) },
];
// Orden y grupo de cada herramienta (de lo más básico a lo más avanzado dentro de cada grupo)
const ORGANIZACION = {
  Redes: ["subredes", "conversor", "ejercicios", "vlsm", "ipv6", "rj45", "cisco", "dns"],
  Sistemas: ["chmod", "cron", "raid", "regex"],
  Seguridad: ["contrasenas", "hash", "codificar"],
  Hardware: ["presupuesto", "transferencia", "sai"],
  Referencia: ["biblioteca", "chuletas", "diccionario", "checklists"],
};
const GRUPO_DE = Object.fromEntries(Object.entries(ORGANIZACION).flatMap(([g, ids]) => ids.map((id, i) => [id, { g, i }])));
let cacheLista = null;
export function lista() {
  if (cacheLista) return cacheLista;
  const grupos = Object.keys(ORGANIZACION);
  const todas = [...BASE, ...Redes.HERRAMIENTAS, ...Sis.HERRAMIENTAS, ...Seg.HERRAMIENTAS, ...Hw.HERRAMIENTAS, ...Extra.HERRAMIENTAS]
    .map((x) => ({ ...x, grupo: GRUPO_DE[x.id]?.g || x.grupo }));
  const pos = (x) => grupos.indexOf(x.grupo) * 100 + (GRUPO_DE[x.id]?.i ?? 99);
  cacheLista = todas.sort((a, b) => pos(a) - pos(b));
  return cacheLista;
}
const ICONO_GRUPO = { Redes: "red", Sistemas: "terminal", Seguridad: "candado", Hardware: "herramienta", Referencia: "materias" };

// ---------- Lo que escribes en las herramientas se recuerda en este dispositivo (30 días) ----------
const CLAVE_HERR = "mochila-herramientas";
const NO_GUARDAR = new Set(["pwProbar", "pwGen", "hashRes", "hashCargando", "dnsError"]);
const OBSOLETAS = ["zona", "zonaSal", "termPre", "term", "termWin", "termSo"]; // de versiones anteriores
function cargarEstado(e) {
  if (e.herrCargado) return;
  e.herrCargado = true;
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE_HERR) || "null");
    if (g && Date.now() - g.t < 30 * 86400 * 1000) e.herr = { ...g.v, ...(e.herr || {}) };
    for (const k of OBSOLETAS) delete e.herr?.[k];
  } catch { /* sin almacenamiento */ }
}
let temporizadorGuardar = null;
function guardarEstado(e) {
  clearTimeout(temporizadorGuardar);
  temporizadorGuardar = setTimeout(() => {
    try {
      const v = Object.fromEntries(Object.entries(e.herr || {}).filter(([k]) => !NO_GUARDAR.has(k)));
      localStorage.setItem(CLAVE_HERR, JSON.stringify({ t: Date.now(), v }));
    } catch { /* lleno o bloqueado */ }
  }, 400);
}

const ICONO_HERR = {
  subredes: "red", vlsm: "red", ejercicios: "tarjetas", ipv6: "red", dns: "web",
  chmod: "candado", cisco: "terminal", raid: "archivo", cron: "reloj",
  contrasenas: "candado", hash: "candado", codificar: "terminal", regex: "buscar",
  rj45: "red", transferencia: "reloj", sai: "chispa", presupuesto: "maletin",
  conversor: "terminal", chuletas: "materias", biblioteca: "materias",
  diccionario: "buscar", checklists: "bandera",
};
const COLOR_GRUPO = { Redes: "g-redes", Sistemas: "g-sistemas", Seguridad: "g-seguridad", Hardware: "g-hardware", Referencia: "g-referencia" };
const chipNivel = (id) => { const n = NIVELES[GUIAS[id]?.nivel]; return n ? `<span class="chip ${n.clase}">${n.t}</span>` : ""; };

function tarjeta(x) {
  return `<a class="tarjeta-herr ${COLOR_GRUPO[x.grupo] || ""}" href="#herramientas/${x.id}">
    <span class="th-icono">${icono(ICONO_HERR[x.id] || ICONO_GRUPO[x.grupo] || "herramienta")}</span>
    <span class="th-texto"><b>${esc(x.t)}</b><span>${esc(x.desc)}</span></span>
    <span class="th-chips">${chipNivel(x.id)}${x.internet ? `<span class="chip">Internet</span>` : ""}</span></a>`;
}

export function vistaHerramientas(e, pestana = "") {
  cargarEstado(e);
  e.herr ||= {};
  guardarEstado(e);
  const t = e.herr;
  const todas = lista();
  const h = todas.find((x) => x.id === pestana);
  if (!h) {
    const q = normalizar(t.buscarHerr || "");
    const nivel = t.nivelHerr || "";
    const filtradas = todas.filter((x) => (!nivel || GUIAS[x.id]?.nivel === nivel)
      && (!q || normalizar(`${x.t} ${x.desc} ${x.grupo} ${GUIAS[x.id]?.que || ""}`).includes(q)));
    const grupos = [...new Set(filtradas.map((x) => x.grupo))];
    const bib = todas.find((x) => x.id === "biblioteca");
    return `<header class="herr-hero">
        <div><h1>Herramientas</h1><p>Calculadoras, chuletas y código para las prácticas de SMX. Cada una te explica qué es y trae un ejemplo.</p></div>
        <div class="herr-destacadas">
          <a class="herr-destacada" href="#herramientas/biblioteca"><span class="th-icono">${icono("materias")}</span>
            <span><b>${esc(bib.t)}</b><small>HTML · CSS · JavaScript · Python · SQL · Java · C · C++ · PHP · Linux · Windows · Git</small></span>${icono("flecha-der")}</a>
          <a class="herr-destacada sb" href="#sandbox"><span class="th-icono">${icono("cubo")}</span>
            <span><b>Sandbox</b><small>Linux de verdad, Windows, Git, Python, SQL y Web para practicar</small></span>${icono("flecha-der")}</a>
        </div>
      </header>
      <div class="herr-filtros">
        <label class="buscador">${icono("buscar")}<input type="search" id="herrQ" data-herr="buscarHerr" value="${esc(t.buscarHerr || "")}" placeholder="Buscar herramienta: cable, permisos, IP…" aria-label="Buscar herramienta"></label>
        <div class="segmentos">${[["", "Todas"], ["basico", "Básico"], ["medio", "Medio"], ["avanzado", "Avanzado"]].map(([v, l]) => `<button type="button" class="segmento" aria-pressed="${nivel === v}" data-accion="herr-nivel" data-v="${v}">${l}</button>`).join("")}</div>
      </div>
      ${filtradas.length ? grupos.map((g) => `<section class="herr-grupo"><h2 class="subtitulo-seccion">${icono(ICONO_GRUPO[g] || "herramienta")} ${g}</h2>
        <div class="rejilla-herr">${filtradas.filter((x) => x.grupo === g).map(tarjeta).join("")}</div></section>`).join("")
        : `<div class="vacio">No hay herramientas con esa búsqueda.</div>`}`;
  }
  const g = GUIAS[h.id] || {};
  const hermanas = todas.filter((x) => x.grupo === h.grupo);
  return `<div class="herr-barra"><button type="button" class="volver" data-ir="herramientas">${icono("flecha-izq")} Herramientas</button></div>
    <section class="herr-cabecera ${COLOR_GRUPO[h.grupo] || ""}">
      <div class="hc-titulo"><span class="th-icono grande">${icono(ICONO_HERR[h.id] || "herramienta")}</span>
        <div><small>${esc(h.grupo)}</small><h1>${esc(h.t)}</h1></div>${chipNivel(h.id)}</div>
      ${g.que ? `<div class="hc-explica">
        <div><b>¿Qué es?</b><p>${esc(g.que)}</p></div>
        <div><b>¿Cuándo lo uso en clase?</b><p>${esc(g.cuando)}</p></div></div>` : ""}
      <div class="fila-botones">
        ${g.ejemplo ? `<button type="button" class="boton principal" data-accion="herr-ejemplo" data-id="${esc(h.id)}">${icono("play")} Probar con el ejemplo</button>` : ""}
        ${e.editor ? `<button type="button" class="boton" data-accion="herr-guardar" data-t="${esc(h.t)}">${icono("materias")} Guardar en una materia</button>` : ""}
      </div>
    </section>
    <div class="segmentos segmentos-scroll">${hermanas.map((x) => `<button type="button" class="segmento" aria-pressed="${x.id === h.id}" data-ir="herramientas/${x.id}">${esc(x.t)}</button>`).join("")}</div>
    <div class="herr-cuerpo">${h.html(e)}</div>
    ${htmlPasos(h.id, t.verPasos === h.id)}
    ${g.palabras?.length ? `<section class="panel herr-palabras"><div class="panel-titulo"><h2>${icono("bombilla")} Palabras clave</h2>
      ${e.editor ? `<button type="button" class="boton peque" data-accion="herr-a-tarjetas" data-id="${esc(h.id)}">${icono("tarjetas")} Añadir a mis tarjetas</button>` : ""}</div>
      <dl>${g.palabras.map(([p, d]) => `<div><dt>${esc(p)}</dt><dd>${esc(d)}</dd></div>`).join("")}</dl></section>` : ""}`;
}

// «¿Cómo se ha hecho?»: el ejemplo explicado paso a paso, desde cero
function htmlPasos(id, abierto) {
  const p = PASOS[id];
  if (!p) return "";
  return `<details class="panel herr-pasos" id="herrPasos" ${abierto ? "open" : ""}>
    <summary><span>${icono("bombilla")}</span><b>¿Cómo se ha hecho? Explicado paso a paso</b></summary>
    <p class="hp-intro">${esc(p.intro)}</p>
    <ol class="hp-lista">${p.pasos.map(([que, como]) => `<li><b>${esc(que)}</b><p>${esc(como)}</p></li>`).join("")}</ol>
    ${p.truco ? `<p class="hp-truco">${icono("chispa")} ${esc(p.truco)}</p>` : ""}
  </details>`;
}

// Copia lo que se ve en la herramienta (resultados, tablas, código) como apunte de una materia
function capturarHerramienta() {
  const vista = document.querySelector(".herr-cuerpo");
  const paneles = vista ? [...vista.querySelectorAll(":scope > section.panel")] : [];
  const trozos = paneles.map((p) => {
    const c = p.cloneNode(true);
    c.querySelectorAll("input, textarea, select").forEach((el, i) => {
      const orig = p.querySelectorAll("input, textarea, select")[i];
      if (orig.type === "file" || orig.type === "search") { el.remove(); return; }
      const valor = orig.type === "checkbox" ? (orig.checked ? "sí" : "no") : orig.tagName === "SELECT" ? orig.selectedOptions[0]?.textContent || "" : orig.value;
      const nuevo = document.createElement(orig.tagName === "TEXTAREA" ? "pre" : "code");
      nuevo.textContent = valor;
      el.replaceWith(nuevo);
    });
    c.querySelectorAll("button, svg, .fila-botones:empty").forEach((x) => x.remove());
    c.querySelectorAll("details").forEach((d) => { d.open = true; });
    return c.innerHTML;
  });
  const html = limpiar(trozos.join("<hr>"));
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return { html, texto: tmp.textContent.replace(/\n{3,}/g, "\n\n").trim() };
}

export const acciones = {
  "herr-guardar"(b, api) {
    const d = api.datos();
    const materias = d.asignaturas || [];
    if (!materias.length) return api.aviso("Primero crea alguna materia.");
    const { html, texto } = capturarHerramienta();
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.innerHTML = `<form class="modal-caja" method="dialog">
      <header class="modal-cabecera"><h2>Guardar en una materia</h2></header>
      <div class="modal-cuerpo rejilla-form">
        <div class="campo ancho"><label for="hgT">Título del apunte</label><input id="hgT" required value="${esc(b.dataset.t)} · ${new Date().toLocaleDateString("es-ES")}"></div>
        <div class="campo ancho"><label for="hgM">Materia</label><select id="hgM">${materias.map((a) => `<option value="${esc(a.id)}">${esc(a.nombre)}</option>`).join("")}</select></div>
        <p class="nota ancho">Se guarda lo que ves ahora en la herramienta (datos, resultados y tablas) como un apunte. Luego puedes editarlo en Materias.</p>
      </div>
      <footer class="modal-pie"><button type="button" class="boton" data-cancelar>Cancelar</button><button type="submit" class="boton principal">Guardar</button></footer></form>`;
    document.body.appendChild(dlg);
    const cerrar = () => { dlg.close(); dlg.remove(); };
    dlg.querySelector("[data-cancelar]").addEventListener("click", cerrar);
    dlg.addEventListener("cancel", cerrar);
    dlg.querySelector("form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const titulo = dlg.querySelector("#hgT").value.trim() || b.dataset.t;
      const asignatura = dlg.querySelector("#hgM").value;
      d.apuntes.push({ id: nuevoId(), titulo, asignatura, fecha: hoyIso(), texto, textoHtml: html, enlace: "", archivos: [] });
      cerrar();
      api.cambiar(false);
      api.aviso(`Guardado en ${materias.find((a) => a.id === asignatura)?.nombre || "la materia"} → Apuntes`);
    });
    dlg.showModal();
  },
  "herr-a-tarjetas"(b, api) {
    const d = api.datos();
    const g = GUIAS[b.dataset.id];
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.innerHTML = `<form class="modal-caja"><header class="modal-cabecera"><h2>Añadir a mis tarjetas</h2></header>
      <div class="modal-cuerpo rejilla-form"><p class="ancho">Se crean <b>${g.palabras.length}</b> tarjetas de repaso («¿Qué es…?»). Las que ya tengas no se repiten.</p>
        <div class="campo ancho"><label for="atM">Materia</label><select id="atM"><option value="">Sin materia</option>${(d.asignaturas || []).map((a) => `<option value="${esc(a.id)}">${esc(a.nombre)}</option>`).join("")}</select></div></div>
      <footer class="modal-pie"><button type="button" class="boton" data-cancelar>Cancelar</button><button type="submit" class="boton principal">Añadir</button></footer></form>`;
    document.body.appendChild(dlg);
    const cerrar = () => { dlg.close(); dlg.remove(); };
    dlg.querySelector("[data-cancelar]").addEventListener("click", cerrar);
    dlg.addEventListener("cancel", cerrar);
    dlg.querySelector("form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const asignatura = dlg.querySelector("#atM").value;
      const ya = new Set(d.tarjetas.map((x) => normalizar(x.pregunta)));
      let n = 0;
      for (const [p, def] of g.palabras) {
        const pregunta = `¿Qué es ${p}?`;
        if (ya.has(normalizar(pregunta))) continue;
        d.tarjetas.push({ id: nuevoId(), asignatura, pregunta, respuesta: def, caja: 1, proxima: hoyIso() });
        n++;
      }
      cerrar();
      api.cambiar(false);
      api.aviso(n ? `${n} tarjetas nuevas. Las tienes en Estudiar → Tarjetas.` : "Ya tenías todas estas tarjetas.");
    });
    dlg.showModal();
  },
  "herr-nivel"(b, api) { api.estado().herr.nivelHerr = b.dataset.v; api.pintar(); },
  "herr-ejemplo"(b, api) {
    const t = api.estado().herr;
    const ej = GUIAS[b.dataset.id]?.ejemplo;
    if (!ej) return;
    const { _nuevoEjercicio, _calcularHash, ...datos } = JSON.parse(JSON.stringify(ej));
    Object.assign(t, datos);
    t.verPasos = b.dataset.id;
    setTimeout(() => document.getElementById("herrPasos")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    if (_nuevoEjercicio) return acciones["herr-ej-otro"](b, api);
    if (_calcularHash) return acciones["herr-hash-texto"](b, api);
    api.pintar();
    api.aviso("Ejemplo cargado. Abajo tienes cómo se ha hecho, paso a paso.");
  },
  "herr-cat"(b, api) { const e = api.estado(); e.herr = { ...(e.herr || {}), cat: b.dataset.cat, buscar: "" }; api.pintar(); },
  ...Redes.acciones, ...Sis.acciones, ...Seg.acciones, ...Hw.acciones, ...Biblio.acciones, ...Extra.acciones,
};
export const formularios = { ...Redes.formularios, ...Extra.formularios };

// Campos con nombre especial (tablas, config Cisco…). Devuelve true si lo ha guardado.
export function alEscribir(t, k, v) {
  return Sis.alEscribir(t, k, v) || Hw.alEscribir(t, k, v) || Extra.alEscribir(t, k, v);
}
export const alArchivo = (input, api) => Seg.alArchivo(input, api);
