# Cartelera — Guía Maestra de Diseño y Construcción

*CMS de cartelería digital autoalojado (Docker) para pantallas de publicidad y de restaurante · Documento para entregar a una IA de desarrollo · Versión 1.0 del documento · 9 de noviembre de 2026*

> **Este documento es solo diseño.** No contiene la aplicación: define qué construir, en qué orden, con qué reglas y cómo comprobar cada paso. «Cartelera» es un nombre provisional; cambiarlo solo afecta al nombre del repositorio, de la imagen y de las variables de entorno.

**Cómo leerlo.** Para la persona propietaria: secciones 1, 2, 15 y Anexos C y D. Para la IA constructora: todo, empezando por la sección 3. Decisiones (DEC-xx), módulos (M0–M12), fases (F0–F6) y tareas (F2.4, etc.) están numerados para poder citarlos sin ambigüedad.

**Contenido:** 1 Resumen ejecutivo · 2 Decisiones de diseño · 3 Instrucciones maestras para la IA · 4 Investigación: proyectos abiertos · 5 Pantallas reales: TV, reproductores y LED exteriores · 6 Arquitectura · 7 Modelo de datos y formato del diseño · 8 Módulos funcionales · 9 Interfaz de usuario · 10 API y protocolo del reproductor · 11 Seguridad · 12 Docker y despliegue · 13 GitHub: repositorio, CI/CD y versiones · 14 Estrategia de pruebas · 15 Plan por fases · 16 Futuro: reproductores nativos y LED · 17 Anexos

## 1. Resumen ejecutivo

### 1.1 Qué es

Cartelera es una aplicación web que se instala en un servidor propio (normalmente Ubuntu) como **un único contenedor Docker** y permite diseñar, programar y publicar contenido en **varias pantallas a la vez**, cada una con un diseño distinto. Sirve para dos usos: **publicidad** (vídeos, imágenes, promociones, rotación de anuncios) y **restaurante** (cartas, menús, precios, «agotado», menú del día).

El usuario diseña de forma visual: arrastra **widgets** (hora, logo, vídeo, carta, texto, información…) sobre un lienzo, los coloca y redimensiona a su gusto, guarda el resultado como **diseño** (con un **tema/skin** de colores y tipografías) y lo asigna a una pantalla. Nada requiere tocar código.

### 1.2 Cómo se usa (flujo de punta a punta)

1. En el servidor: `docker compose up -d` (la imagen se descarga de GitHub Container Registry).
2. Desde un PC: abrir `http://IP-DEL-SERVIDOR:8080/admin` y crear la cuenta de administrador (asistente de primer uso).
3. Subir medios, crear una pantalla, elegir una plantilla, ajustar el diseño arrastrando widgets y pulsar **Publicar**.
4. En el televisor: abrir el navegador en `http://IP-DEL-SERVIDOR:8080/tv`, elegir la pantalla predefinida, introducir el PIN (o usar el enlace directo / código de emparejamiento) y poner pantalla completa. Desde ese momento la pantalla se actualiza sola.

### 1.3 Alcance de la versión 1.0 (fase web)

- Reproductor **web** para cualquier dispositivo con navegador (TV con navegador, mini-PC, Raspberry Pi, Android TV box, pantallas profesionales Samsung/LG con carga de URL).
- Gestión de **al menos 5 pantallas simultáneas** (sin límite duro; objetivo probado: 20) con diseños diferentes.
- Editor visual, biblioteca de medios, menús de restaurante, temas, plantillas, programación horaria, monitoreo, informes de reproducción y copias de seguridad.
- Todo construido, probado y publicado por **GitHub Actions**; la imagen se descarga de `ghcr.io`.

### 1.4 Fuera de alcance de la 1.0 (pero previsto en el diseño)

Reproductores nativos (Linux, Android, Windows, Tizen, webOS), integración con controladores de pantallas LED exteriores, multi-organización, cobro a anunciantes, pantallas táctiles/interactivas, importación de PowerPoint/PDF multipágina. La sección 16 deja el camino preparado y la sección 10 fija un **protocolo de reproductor estable** para añadir esos reproductores sin rehacer el servidor.

### 1.5 Principios de diseño (por orden de prioridad)

1. **Fiabilidad sobre espectáculo:** una pantalla jamás debe quedarse en blanco; si falla la red, sigue con lo último válido.
2. **Cero código para el usuario:** todo visual, con textos claros en español y con deshacer/rehacer.
3. **Un contenedor, un volumen:** instalación y copia de seguridad triviales.
4. **Lo que ves es lo que sale:** el editor y el reproductor usan el mismo motor de render.
5. **Compatible con navegadores viejos de TV** (hasta Chromium 53, ver §5.3).
6. **Interfaz minimalista y sobria:** sin modas visuales; claridad por encima de estética.
7. **Contrato estable:** API y protocolo versionados desde el primer día.

### 1.6 Criterios de éxito (medibles)

| # | Criterio | Cómo se comprueba |
| --- | --- | --- |
| S1 | Instalación a primera pantalla en menos de 10 min sin tocar código | Prueba manual guiada en F6 |
| S2 | 5 pantallas con 5 diseños distintos a la vez; un cambio publicado llega en menos de 3 s en LAN | E2E automatizado (F3) |
| S3 | La pantalla sobrevive sin intervención a caída de red, reinicio del servidor y reinicio del navegador | E2E + prueba de resistencia (F5) |
| S4 | Una persona no técnica crea un diseño de 5 elementos en menos de 15 min | Prueba de usabilidad (F6) |
| S5 | Imagen menor de 400 MB, arranque menor de 10 s, menos de 512 MB de RAM en reposo con 5 pantallas | Medición en CI (F5) |
| S6 | CI verde en cada fusión a `main`; 0 vulnerabilidades críticas con parche disponible | Workflows (desde F0) |

## 2. Decisiones de diseño (registro)

Cada decisión se puede revisar, pero solo mediante un ADR (registro de decisión de arquitectura) en `docs/adr/` aprobado por el humano.

| ID | Decisión | Motivo |
| --- | --- | --- |
| DEC-01 | Un solo contenedor (servidor + admin + reproductor estático) y un volumen `/data` | Instalar y respaldar fácil; sin orquestación |
| DEC-02 | Monorepo TypeScript con pnpm workspaces. Node.js 24 LTS al inicio; CI también en 26; evaluar subir a 26 en F6 | Tipos compartidos entre servidor, admin y player; 24 es el más probado con módulos nativos y 26 ya es LTS desde oct-2026 |
| DEC-03 | Servidor Fastify + validación zod + OpenAPI generado | Ligero y rápido; el contrato sale de los mismos esquemas |
| DEC-04 | SQLite (modo WAL) con better-sqlite3 + Drizzle ORM; sin Redis ni Postgres en 1.x | Cero servicios extra; sobra para decenas de pantallas |
| DEC-05 | Admin: React + Vite + TypeScript + Tailwind + Radix; estado con Zustand y TanStack Query | Accesible, mantenido, mucho conocimiento disponible |
| DEC-06 | Editor en DOM (no canvas) con react-moveable y react-selecto | Fidelidad exacta con el reproductor, que también es DOM |
| DEC-07 | Reproductor en TypeScript sin framework, con bundle «legado» ES5; mínimo garantizado Chromium 53 | TV de 2018 en adelante (webOS 4 / Tizen 4); arranque rápido |
| DEC-08 | Un único motor de render (`render-core`) para editor, vista previa y reproductor | Lo que ves es lo que sale |
| DEC-09 | Diseño en **resolución de diseño fija** con escalado por transformación; rotación de pantalla 0/90/180/270 | Sirve para TV, verticales y LED con resoluciones raras |
| DEC-10 | Medios direccionados por hash SHA-256, inmutables, caché larga | Caché fiable, deduplicación, sin invalidaciones |
| DEC-11 | Cada pantalla recibe un **manifiesto** (diseños + programación + medios + datos). Empuje por WebSocket, respaldo por sondeo. La programación se evalúa en el reproductor | Funciona sin conexión y tolera fallos |
| DEC-12 | Vinculación de pantallas por 3 métodos: enlace directo con token, selector + PIN, código de 6 dígitos. MVP: los dos primeros | Con mando a distancia teclear es doloroso |
| DEC-13 | Autenticación admin con usuarios locales (argon2id), cookie httpOnly y 3 roles: Administrador, Editor, Operador | Simple y suficiente; OIDC queda para después |
| DEC-14 | Los menús de restaurante son datos propios, independientes de los diseños | Cambiar un precio o marcar «agotado» sin tocar diseños |
| DEC-15 | El servidor obtiene y cachea datos externos (clima, RSS, hojas); la pantalla nunca llama a terceros | Funciona sin Internet y no expone claves |
| DEC-16 | La licencia del proyecto la decide el humano (pendiente, Anexo D). Sin copiar código AGPL/GPL | Evitar obligaciones copyleft no deseadas |
| DEC-17 | Imagen multi-arquitectura (amd64 y arm64), no-root, con healthcheck, publicada en GHCR | Servidores x86 y ARM; seguridad básica |
| DEC-18 | Todo CI/CD en GitHub Actions; `main` protegida; la IA verifica con `gh` tras cada push | Requisito del propietario |
| DEC-19 | SemVer + Conventional Commits + release-please | Versionado y changelog automáticos |
| DEC-20 | Reproductores nativos solo después de la 1.0 web, sobre el protocolo v1 ya estable | Reducir riesgo y alcance inicial |

## 3. Instrucciones maestras para la IA constructora

### 3.1 Tu papel

Eres el ingeniero principal del proyecto. Construyes Cartelera **por fases** siguiendo este documento y entregas cada fase verificada en GitHub Actions. El humano no programa: valida resultados y toma decisiones en los puntos de control. No tienes memoria entre sesiones; tu memoria es el repositorio (§3.6).

### 3.2 Reglas de oro

1. Lee este documento completo y `docs/` antes de actuar. Es la fuente de verdad; para cambiar algo, escribe un ADR.
2. Trabaja por fases (§15). **No empieces una fase sin confirmación explícita del humano** al cerrar la anterior.
3. «Terminado» significa **verde en GitHub Actions**, no «funciona en mi máquina».
4. Ramas cortas y PR pequeños (idealmente menos de 400 líneas netas); commits convencionales (`feat:`, `fix:`, `chore:`…).
5. Tras cada `push`, vigila las Actions y corrige hasta verde. Máximo 3 intentos por causa raíz; si no cede, escala con un informe (§3.7).
6. Prohibido: desactivar o borrar pruebas/linters, `--no-verify`, `continue-on-error` para ocultar fallos, actualizar snapshots sin revisarlos, rebajar umbrales de cobertura.
7. Seguridad: ningún secreto en el repositorio; usa solo `GITHUB_TOKEN`; fija dependencias y acciones (por SHA completo con comentario de versión).
8. **No confíes en las versiones de este documento.** Antes de usar acciones, imágenes base o librerías, consulta la versión estable vigente en la fuente oficial: los ejemplos pueden estar obsoletos.
9. No inventes: ante una ambigüedad aplica el valor por defecto del Anexo D, regístralo en `docs/PROGRESS.md` y sigue; si el riesgo es alto, pregunta en el punto de control.
10. Documenta mientras construyes: README, `docs/`, ADRs; el CHANGELOG lo genera release-please.
11. Idioma: interfaz y documentación de usuario en **español**; código, commits, issues y PR en **inglés**; los textos de la interfaz siempre vía i18n (nunca incrustados).
12. Mantén `docs/PROGRESS.md` al día al final de cada tarea (estado, decisiones, pendientes, comandos útiles).

### 3.3 Ciclo de trabajo por tarea

1. Lee la tarea y sus criterios de aceptación (§15). 2. Crea la rama `feat/f<fase>-<tarea>-<slug>`. 3. Escribe primero las pruebas cuando sea viable. 4. Implementa. 5. Ejecuta en local `pnpm lint && pnpm typecheck && pnpm test && pnpm build`. 6. Commit convencional. 7. `git push` y abre el PR con la plantilla. 8. Vigila las Actions (§3.4). 9. Corrige hasta verde. 10. Autorrevisa el diff (¿pruebas? ¿docs? ¿textos i18n? ¿secretos?). 11. Fusiona con squash. 12. Actualiza `docs/PROGRESS.md`.

### 3.4 Cómo vigilar GitHub (cadencia y comandos)

**Cadencia:** (a) tras cada push, hasta que termine; (b) al empezar y al terminar cada sesión: estado de `main`, PR de Dependabot y alertas de seguridad; (c) antes de cada punto de control: ejecución completa verde en `main` y la imagen publicada.

```
gh run list --branch <rama> --limit 5
gh run watch <id> --exit-status
gh run view <id> --log-failed
gh pr checks <n> --watch
gh pr create --fill
gh pr merge <n> --squash --auto      # solo con checks requeridos en verde
gh run list --workflow docker.yml --branch main --limit 3
gh api repos/{owner}/{repo}/dependabot/alerts --jq 'length'
```

Nunca des por bueno un cambio sin ver su ejecución terminada. Tras fusionar a `main`, comprueba también el workflow de publicación de la imagen y que `docker pull ghcr.io/<usuario>/cartelera:edge` funciona.

### 3.5 Puntos de control (fin de cada fase)

Entrega: informe con la plantilla del Anexo B, enlaces a ejecuciones verdes, etiqueta de versión, guion de demostración (pasos que el humano puede repetir) y riesgos abiertos. Después **detente y espera** la confirmación escrita del humano.

### 3.6 Memoria del proyecto (en el repositorio)

- `AGENTS.md` (o `CLAUDE.md`): máximo 150 líneas con comandos, estructura, convenciones y reglas de oro resumidas.
- `docs/spec/`: copia versionada de este documento (los cambios pasan por ADR).
- `docs/adr/NNNN-titulo.md`: decisiones nuevas o cambiadas.
- `docs/PROGRESS.md`: estado por tarea, valores por defecto asumidos, bloqueos.
- `docs/runbooks/`: operación (instalar, actualizar, restaurar, kiosco por dispositivo).

### 3.7 Si te bloqueas

Tras 3 intentos fallidos por la misma causa: deja de intentar; redacta un informe breve (síntoma, evidencia con enlaces y logs, hipótesis, opciones con pros y contras, recomendación) y pide decisión al humano. No «arregles» con atajos.

## 4. Investigación: proyectos abiertos y qué aprovechar

*Fuentes consultadas el 9-nov-2026 (lista en §17.6). Los datos de estado pueden cambiar: verifícalos antes de depender de ellos.*

### 4.1 Panorama

| Proyecto | Qué es | Licencia | Aprovechar | Evitar |
| --- | --- | --- | --- | --- |
| **Xibo** | CMS en PHP más reproductores: Windows (abierto) y Linux; Android, webOS, Tizen y ChromeOS son comerciales | AGPL-3.0 (CMS y reproductor Windows) | Menu Boards independientes de los diseños (menú → categorías → productos, con disponibilidad y opción de atenuar los agotados); editor con elementos, capas y agrupación; programación con prioridades; campañas; acciones interactivas; canal de tiempo real (XMR) | Despliegue pesado (varios contenedores y MySQL; comparativas lo sitúan en 2–4 GB de RAM); interfaz recargada; copiar código |
| **Anthias** (antes Screenly OSE) | Señalización para Raspberry Pi 2–5 y PC x86 de 64 bits; un panel web por dispositivo | GPLv2 (doble licencia comercial) | Simplicidad medio → lista → pantalla; páginas web como contenido; imágenes de disco listas | No gestiona varias pantallas desde un punto; Debian Trixie no declarado como compatible en la fuente consultada |
| **piSignage** | Servidor Node.js + MongoDB y reproductor para Raspberry Pi; servidor gratuito y apps de reproductor de pago según listados comunitarios | Mixta | Plantillas multizona; grupos de pantallas | Dependencia de MongoDB; modelo comercial mixto |
| **Screenlite** | CMS autoalojado en desarrollo: Node.js, WebSockets, React, Docker y reproductores JS web/escritorio | Abierta | Arquitectura muy parecida a la elegida; idea de adaptadores de reproductor | Depender de él (madurez por verificar) |
| **Dashkiosk** | Gestor de paneles: cada receptor tiene identificador, nombre y grupo | Abierta | Patrón receptor → grupo → contenido; guía oficial con Ubuntu Frame | Pensado para paneles web, no para diseños |
| **Garlic Player / Garlic-Hub** | Reproductor SMIL y un CMS en desarrollo | Abierta | Idea de manifiesto declarativo | Adoptar SMIL |
| **MagicMirror²** | Plataforma modular de widgets en pantalla | MIT | Contrato de módulo/widget y configuración declarativa | Configuración por archivos JS |
| Descontinuados (según listados de 2025) | DisplayMonkey, Libre Signage, info-beamer (versión abierta antigua), HFL player | — | — | No usar como base |

Referencias comerciales solo para flujo e inspiración de UX (sin copiar nada; no evaluadas aquí): Yodeck, ScreenCloud, OptiSigns, Fugo.

### 4.2 Lecciones que condicionan el diseño

- El espacio abierto está partido: o un CMS potente y pesado (Xibo) o un reproductor simple por dispositivo (Anthias). **El hueco:** CMS ligero, un contenedor, editor visual sencillo, pensado para restaurantes y publicidad.
- Los **menús como datos aparte** (Xibo) son la mejor idea para restaurantes: se edita un precio una vez y se actualizan todas las pantallas.
- Los **reproductores multi-plataforma** son el mayor coste de mantenimiento. Empezar por web y fijar un protocolo estable (DEC-20).
- El aprovisionamiento de dispositivos (instalar SO, kiosco) lo resuelven mejor herramientas aparte; se documenta en runbooks en vez de reinventarlo.
- La **caché local y el funcionamiento sin conexión** distinguen un buen reproductor de uno frágil.

### 4.3 Licencias: qué se puede «reutilizar o copiar»

Reglas para la IA (no es asesoría legal; la decisión final es del humano):

1. **Ideas, flujos, estructuras funcionales y nombres de conceptos:** libres de tomar.
2. **Código, estilos, textos e iconos de Xibo (AGPL-3.0) o Anthias (GPLv2):** no copiar. Hacerlo obligaría a licenciar el proyecto igual y, con AGPL, a ofrecer el código a quienes lo usen por red.
3. **Librerías** con licencia MIT, BSD, Apache-2.0 o ISC: permitidas.
4. El CI genera `THIRD_PARTY_NOTICES.md` (p. ej. con `license-checker`) y **falla** si aparece una licencia no permitida (GPL, AGPL, SSPL, comerciales).
5. `ffmpeg` se invoca como binario externo; incluir su aviso de licencia en la imagen. Tipografías: solo OFL o Apache.

### 4.4 Librerías candidatas (verificar versión y licencia vigentes al usarlas)

| Función | Elección | Alternativa |
| --- | --- | --- |
| Servidor HTTP/WS | Fastify + @fastify/websocket (ws) | — |
| Validación y contrato | zod + generación OpenAPI | — |
| BD y migraciones | better-sqlite3 + Drizzle + drizzle-kit | Kysely |
| Contraseñas | argon2 (argon2id) | scrypt nativo |
| Imágenes | sharp | — |
| Vídeo | ffmpeg/ffprobe (binario) | — |
| Admin UI | React, Vite, Tailwind, Radix UI, lucide-react | — |
| Arrastrar/redimensionar | react-moveable + react-selecto | interact.js, Konva |
| Listas ordenables | dnd-kit | — |
| Texto enriquecido (editor) | Tiptap, guardado como estructura propia (sin HTML crudo) | Lexical |
| i18n | react-i18next | Lingui |
| Fuentes | @fontsource (OFL), subconjunto latin y latin-ext | — |
| QR | qrcode | uqr |
| Pruebas | Vitest, Playwright, axe-core | — |
| Logs | pino | — |
| Compatibilidad | Babel + core-js selectivo, es-check, eslint-plugin-compat | — |

## 5. Pantallas reales: TV, reproductores y LED exteriores

### 5.1 Idea central

En la 1.0, **una pantalla es cualquier dispositivo que abre una URL en un navegador**. Cuando la pantalla no tiene navegador (LED exterior con controlador cerrado) hay tres caminos: poner delante un reproductor barato con salida HDMI, instalar un reproductor nativo (fase 7 en adelante) o integrarse con el sistema del fabricante. Esta sección fundamenta esas rutas con datos verificados el 9-nov-2026.

### 5.2 Cómo mostrar la URL según el dispositivo

| Dispositivo | Cómo se lleva la URL | Notas |
| --- | --- | --- |
| Mini-PC o PC (Windows/Ubuntu) con Chrome o Chromium en kiosco | `chromium --kiosk URL` con arranque automático | Ruta más fiable y universal. Opciones útiles: `--noerrdialogs --disable-infobars --autoplay-policy=no-user-gesture-required --check-for-update-interval=31536000` |
| Raspberry Pi 4 o 5 con Raspberry Pi OS (Bookworm/Trixie, compositor labwc sobre Wayland) | Chromium en kiosco lanzado desde `~/.config/labwc/autostart` | Documentado por la propia Raspberry Pi; usar Pi 4/5 para vídeo |
| Ubuntu con Ubuntu Frame | Dos snaps (`ubuntu-frame` y `wpe-webkit-mir-kiosk`) y `snap set wpe-webkit-mir-kiosk url=...` | Muy robusto; usa WPE WebKit (no Chromium): probar compatibilidad |
| Android TV box o stick | Navegador en kiosco (p. ej. Fully Kiosk Browser, de pago) hoy; APK propio en F9 | Autoarranque y kiosco requieren app dedicada |
| Samsung profesional (SSSP/Tizen) | Menú «Play via → URL Launcher» (a veces «Custom App»); la URL se escribe con el teclado en pantalla, **todo en minúsculas** | URL corta y en minúsculas (§9.5) |
| LG webOS Signage profesional | Ez Setting → «Play via URL» (activar URL Loader y fijar la URL) | Se abre al encender y se mantiene en pantalla |
| TV de consumo (Samsung, LG, Android TV) | Aplicación de navegador; sin arranque automático ni kiosco | Sirve para pruebas; no para producción 24/7 |

### 5.3 Motores de navegador en TV y reglas para el reproductor

Una TV conserva el motor con el que salió de fábrica: el modelo más viejo que se quiera soportar fija lo que el reproductor puede usar. Versiones según la documentación oficial de Samsung y LG:

| Año | Samsung (Tizen → motor) | LG (webOS → motor) |
| --- | --- | --- |
| 2016–2017 | Tizen 3.0 (2017) → Chromium 47; Tizen 2.4 (2016) → WebKit antiguo | webOS 3.x → Chromium 38 |
| 2018 | Tizen 4.0 → Chromium 56 | webOS 4.x (2018–2019) → Chromium 53 |
| 2019 | Tizen 5.0 → Chromium 63 | webOS 4.x → Chromium 53 |
| 2020 | Tizen 5.5 → Chromium 69 | webOS 5.x → Chromium 68 |
| 2021 | Tizen 6.0 → Chromium 76 | webOS 6.x → Chromium 79 |
| 2022 | Tizen 6.5 → Chromium 85 | webOS 22 → Chromium 87 |
| 2023 | Tizen 7.0 → Chromium 94 | webOS 23 → Chromium 94 |
| 2024 | Tizen 8.0 → Chromium 108 | webOS 24 → Chromium 108 |

**Niveles de soporte:** *Nivel A (garantizado)*: Chromium 53 o superior (TV de 2018 en adelante y cualquier navegador moderno). *Nivel B (mejor esfuerzo, sin garantía)*: Chromium 38–47; solo texto, imágenes y reloj. *No soportado*: WebKit antiguo (2016 o anterior).

**Reglas de código del reproductor** (DEC-07; el CI las verifica):

- Salida ES5 con Babel y core-js selectivo; `es-check es5` sobre el bundle; `browserslist` = `chrome >= 53`; `eslint-plugin-compat` activo.
- Sin CSS Grid (Chromium 57+), sin `gap` en flexbox (84+), sin `aspect-ratio` (88+), sin `inset` (87+), sin `ResizeObserver` (64+). Usar posicionamiento absoluto en píxeles de la resolución de diseño, flexbox simple y variables CSS (49+).
- No depender de `Intl` con zona horaria: el servidor envía la hora corregida y el desfase de la pantalla; usar `Intl` solo con detección de soporte y alternativa.
- Vídeo: **H.264 (perfil High, nivel 4.1) + AAC en MP4 con `faststart`** es el único formato garantizado en TV (ver M2).
- Sin Service Worker obligatorio: solo funciona en contexto seguro (HTTPS o localhost); en LAN con HTTP la caché se apoya en cabeceras HTTP y almacenamiento local (§6.5).
- Presupuesto: bundle JS del player ≤ 150 KB gzip; primer render ≤ 3 s en LAN.

### 5.4 Pantallas LED exteriores: qué hay detrás

Arquitectura típica: módulos LED → tarjetas receptoras → caja o tarjeta emisora, o procesador de vídeo → fuente de señal (un PC o un reproductor por HDMI/DVI). La alternativa es un **controlador asíncrono** con reproductor interno, al que se carga el contenido por red o USB con el software del fabricante.

| Marca | Emisores / procesadores (entrada HDMI/DVI) | Reproductores asíncronos | Software típico |
| --- | --- | --- | --- |
| Novastar | MSD300 (emisor DVI), series VX y H (procesadores) | Serie Taurus (TB1, TB2, TB30, TB40, TB50, TB60) | ViPlex Express/Handy, NovaLCT, nube VNNOX |
| Colorlight | S4 (emisor HDMI/DVI), series X y Z (procesadores) | Series A, C y Z según modelo | LEDVISION (verificar) |
| Linsn | TS802 y TS952 (emisores), serie X (procesadores) | Series A y C (verificar) | LED Studio (verificar) |
| Huidu | VP210, VP410, VP620, VP820 (procesadores) | Series R, C, A y D (verificar) | HDPlayer (verificar) |

Datos comprobados en fuentes de fabricantes, distribuidores y documentación:

- Emisores y procesadores aceptan vídeo por HDMI, DVI o VGA. Ejemplos: el MSD300 admite 1 entrada DVI hasta 1920×1200 a 60 Hz; el S4 de Colorlight, HDMI y DVI hasta 1920×1200. La **capacidad de carga se mide en píxeles** (p. ej. 1,3 millones en los Linsn X102 y Huidu VP210), así que las resoluciones reales suelen ser raras: el editor debe admitir cualquier resolución.
- **Novastar Taurus (TB2, TB30, TB40, TB50, TB60) son reproductores Android** (el TB50 trae Android 11) y admiten APK de terceros instalados con ViPlex Express: hay que desactivar el reproductor interno («PlayService») y, para kiosco total, el instalador activa ADB por TCP/IP y concede derechos de propietario del dispositivo. Ya lo hacen Navori, OnSign TV y DISPL.
- **La nube VNNOX de Novastar ofrece API abierta** (NovaCloud Open Platform): lista y estado de reproductores, publicación de programas, capturas de pantalla, brillo, volumen, sincronización NTP y cambio de fuente de vídeo, con autenticación AK/AS. Solo los reproductores asíncronos (TB, TU, VPlayer) se publican desde VNNOX Standard/AD.

### 5.5 Estrategia de compatibilidad con LED exterior

| Caso | Qué hacer | Cuándo |
| --- | --- | --- |
| **A.** El controlador tiene entrada HDMI/DVI (emisor o procesador) | Mini-PC o Raspberry Pi con Chromium en kiosco → HDMI → controlador. Resolución de diseño = resolución de entrada del controlador | v1.0 |
| **B.** Hay un PC con tarjeta emisora (salida DVI de la GPU) | Navegador a pantalla completa en el monitor que alimenta la tarjeta | v1.0 |
| **C.** Controlador asíncrono con Android (p. ej. Taurus) | APK «Cartelera Player» (F9); mientras tanto, app de navegador en kiosco instalada con la herramienta del fabricante; alternativa: conector VNNOX (F12) | F9 / F12 |
| **D.** Controlador asíncrono cerrado, sin HDMI ni Android | Exportar el diseño a vídeo/imágenes desde el servidor (Chromium sin interfaz + ffmpeg) y cargarlo con la herramienta del fabricante; o añadir un procesador con entrada HDMI | F12 |
| **E.** No se sabe qué hay | Hacer el checklist de §5.6 | Antes de F7 |

### 5.6 Checklist: averiguar qué sistema usa tu pantalla exterior

1. Fotografiar la caja o tarjeta de control (marca y modelo en la etiqueta) y todos sus conectores.
2. Anotar si tiene HDMI, DVI, VGA, USB, RJ45, Wi-Fi o 4G, y si hay un PC conectado.
3. Preguntar al instalador: marca del controlador, programa con el que cargó el contenido (ViPlex, LEDVISION, HDPlayer, LED Studio u otro) y si hay cuenta en la nube.
4. Anotar resolución total en píxeles (ancho × alto), tipo de módulo y número de gabinetes.
5. Si hay entrada HDMI/DVI, probar con un portátil: ¿aparece el escritorio en la pantalla?
6. Si el controlador es Android, comprobar con la herramienta del fabricante si permite instalar aplicaciones.
7. Enviar fotos y datos a la IA para elegir la ruta A–E.

### 5.7 Pautas de diseño para pantallas exteriores (reglas prácticas)

Alto contraste, tipografías gruesas sin trazos finos, mensajes cortos, tiempos de lectura generosos, sin degradados sutiles ni texto pequeño; probar siempre en la pantalla real y a la distancia real. El navegador **no controla el brillo del LED**: se ajusta en el controlador (o por API del fabricante, F12). Para la noche, programar un diseño oscuro. Estas pautas se incluyen como plantilla «LED exterior» (M6).

## 6. Arquitectura

### 6.1 Vista general

```
 PC (admin)         TV / mini-PC / Pi            Player nativo (futuro)
 /admin ----+       /tv ----------+              API + WS (protocolo v1) --+
            v                     v                                         v
   +--------------- Contenedor cartelera :8080 ----------------------------+
   | Fastify: REST /api/v1 - WS /ws - estaticos (admin, tv)                |
   | /media (archivos por hash) - /healthz - /metrics                      |
   | Workers internos: medios (ffmpeg, sharp) - datos externos             |
   | SQLite (WAL) + /data/media    <- volumen unico                        |
   +-----------------------------------------------------------------------+
        (opcional) Caddy o Traefik delante para HTTPS
```

### 6.2 Estructura del monorepo

```
cartelera/
  apps/
    server/        Fastify: API, WS, workers, migraciones
    admin/         SPA React servida en /admin
    player/        reproductor web servido en /tv (bundle ES5)
  packages/
    shared/        esquemas zod, tipos, protocolo, resolveSchedule
    render-core/   motor de render + runtime de widgets (sin framework)
    widgets/       por widget: esquema de props, editor y runtime
  e2e/             pruebas Playwright
  docker/          Dockerfile, compose.example.yml, entrypoint.sh
  docs/            spec, adr, runbooks, PROGRESS.md
  .github/         workflows, dependabot.yml, plantillas, CODEOWNERS
```

### 6.3 Flujos principales

**A. Publicar un diseño.** 1) El editor guarda el borrador cada 2 s (`PUT /layouts/:id/draft`). 2) «Publicar» llama a `POST /layouts/:id/publish`: valida con zod, sube la versión y guarda copia en `layout_versions`. 3) El servidor calcula qué pantallas se ven afectadas (por programación) y recalcula el hash de su manifiesto. 4) Emite `manifest.changed` por WebSocket. 5) Cada pantalla pide el manifiesto (`If-None-Match`), precarga los medios nuevos y **cambia de diseño de forma atómica**, sin parpadeo, cuando todo está listo (espera máxima 30 s; si falta algo, conserva el anterior y reintenta).

**B. Arranque de una pantalla.** Abrir `/tv` → si no hay token guardado, vinculación (M7); si lo hay, pedir manifiesto (si falla, usar la copia local) → renderizar → abrir WebSocket → latido cada 30 s → recarga suave diaria a la hora `refreshAt` (04:00 por defecto).

**C. Un dato cambia (plato agotado).** El Operador marca «agotado» → se actualiza `menu_items` → se recalcula el hash de las pantallas que usan ese menú → WebSocket → manifiesto → el widget repinta solo su zona, sin recargar el diseño. Objetivo: menos de 3 s.

**D. Sin servidor.** Si cae el WebSocket, la pantalla entra en modo desconectado: sigue con el manifiesto local, evalúa la programación con su reloj corregido y reintenta conectar con retroceso exponencial (1 s hasta 60 s, con aleatoriedad). Al volver compara hashes y se sincroniza. Nunca muestra errores en pantalla; solo registra y, si está activado el modo depuración, un indicador discreto.

### 6.4 Resolución de diseño, escalado y rotación (DEC-09)

- Cada diseño declara `canvas.width × canvas.height` (p. ej. 1920×1080). El player crea un contenedor de ese tamaño y aplica `transform: scale(s)`, con `s = min(anchoVentana/W, altoVentana/H)` en modo `fit` (centrado, con barras del color de fondo). Otros modos: `fill` (cubre recortando) y `stretch` (deforma; solo para LED con resolución exacta).
- **Rotación por pantalla** (0, 90, 180, 270) aplicada al contenedor raíz antes del escalado: sirve para TV montadas en vertical o LED cableados girados.
- Presets: 1920×1080, 1080×1920, 1280×720, 3840×2160, 1920×540 (barra) y personalizado (de 64 a 16384 px por lado). Los tamaños de texto se expresan en px de la resolución de diseño.

### 6.5 Funcionamiento sin conexión (por niveles)

- **Nivel 1 (siempre):** manifiesto y datos en `localStorage` o IndexedDB; medios con `Cache-Control: immutable` y precarga anticipada.
- **Nivel 2 (solo en HTTPS o localhost):** Service Worker + Cache API para guardar medios por hash.
- **Nivel 3 (reproductores nativos, F7+):** descarga a disco con reanudación y limpieza LRU.

Si se sirve por HTTP en LAN, el nivel 2 no está disponible: documentarlo y recomendar HTTPS (§12.5) cuando se necesite resiliencia fuerte.

### 6.6 Requisitos no funcionales

| Área | Requisito |
| --- | --- |
| Rendimiento | Servidor: menos de 512 MB de RAM en reposo con 5 pantallas; manifiesto menor de 200 KB sin medios; publicación visible en pantalla en menos de 3 s (LAN) |
| Fiabilidad | 7 días continuos sin intervención; crecimiento de memoria del player menor de 50 MB/día; recuperación automática tras caída de red, de servidor y de navegador |
| Compatibilidad | Nivel A de §5.3; admin en Chrome, Edge, Firefox y Safari de los dos últimos años |
| Seguridad | Sección 11 |
| Mantenibilidad | Cobertura de pruebas: 80 % línea en `shared` y `render-core`, 70 % en servidor; complejidad y duplicación vigiladas por lint |
| Accesibilidad (admin) | WCAG 2.1 AA en flujos principales (axe sin errores críticos) |
| i18n | Español por defecto; inglés preparado; fechas, números y moneda por configuración |
| Observabilidad | Logs JSON, `/healthz`, `/readyz`, `/metrics` (opcional), panel de estado de pantallas |

## 7. Modelo de datos y formato del diseño

### 7.1 Entidades

Convenciones: IDs ULID en texto; fechas como milisegundos epoch UTC (entero); claves foráneas activas; migraciones solo hacia adelante con copia automática de la base antes de migrar; borrado lógico solo donde se indica.

| Tabla | Campos clave |
| --- | --- |
| `users`, `sessions` | email, nombre, rol (admin/editor/operador), `password_hash`, desactivado; sesión: caducidad, agente, IP |
| `settings` | clave, valor JSON (nombre del negocio, zona horaria, idioma, retenciones) |
| `media_assets`, `media_folders` | `sha256`, tipo, mime, tamaño, ancho, alto, duración, nombre, carpeta, etiquetas, rutas de original y versión web, estado (processing/ready/error) |
| `themes` | nombre, `tokens_json`, integrado (sí/no) |
| `layouts`, `layout_versions` | nombre, `canvas_json`, tema, `draft_json`, `published_json`, versión publicada, es plantilla, miniatura; historial: últimas 20 versiones |
| `playlists`, `playlist_items` | nombre; ítem: posición, tipo (medio/texto/menú/url), referencia, duración, transición, ventana horaria, peso |
| `menus`, `menu_sections`, `menu_items` | menú: moneda, idioma; sección: nombre, descripción, imagen, posición; plato: nombre, descripción, `price_minor`, variantes, imagen, etiquetas, alérgenos, estado (available/soldout/hidden), destacado, ventana horaria |
| `variables` | clave, valor, tipo (texto/número/sí-no) |
| `data_sources`, `data_snapshots` | tipo (weather/rss/csv/json/ical), configuración, frecuencia, último éxito, último error; instantánea con carga útil |
| `screens`, `screen_groups` | nombre, `slug`, grupo, resolución, rotación, modo de escala, zona horaria, diseño por defecto, `pin_hash`, visible en selector, `token_hash`, último latido, IP, agente, versión del player, diseño actual, hash del manifiesto, ajustes JSON, habilitada |
| `schedule_entries` | destino (pantalla/grupo/todas), diseño, prioridad, rango de fechas, máscara de días, hora inicio/fin, habilitada, nombre |
| `overrides` | destino, diseño o mensaje, inicio, fin, creador |
| `play_logs` | pantalla, instante, diseño, elemento, medio, duración (agregable por día) |
| `audit_log`, `jobs` | auditoría: quién, qué, cuándo, entidad, resumen; trabajos: tipo, carga, estado, intentos, próxima ejecución, error |

### 7.2 Formato del diseño (JSON versionado)

El diseño se guarda como JSON validado por zod en `packages/shared`. Se muestra en YAML por legibilidad; en la base de datos y en la API es JSON con las mismas claves.

```yaml
schemaVersion: 1
id: 01JC8Z5K3W9V2M6T4H7Q1N0BXE
name: Carta horizontal (almuerzo)
canvas:
  width: 1920
  height: 1080
  background: { type: color, value: '{theme.bg}' }
themeId: 01JC8Z0000THEMEBASE000000
elements:
  - id: el_logo
    type: image
    name: Logo
    frame: { x: 60, y: 40, w: 260, h: 120, z: 10, rotation: 0, opacity: 1 }
    props: { mediaId: 01JC8Z1MEDIA0LOGO00000000, fit: contain }
  - id: el_hora
    type: clock
    name: Hora
    frame: { x: 1540, y: 40, w: 320, h: 120, z: 10 }
    props: { format: 'HH:mm', showSeconds: false, align: right }
    style: { color: '{theme.text}', fontFamily: '{theme.fontHeading}', fontSize: 72 }
  - id: el_carta
    type: menu
    name: Carta
    frame: { x: 60, y: 200, w: 1100, h: 820, z: 5 }
    props: { menuId: 01JC8Z2MENU000ALMUERZO00, layout: columns, columns: 2, overflow: paginate, pageSeconds: 12, soldOut: dim }
  - id: el_video
    type: playlist
    name: Promociones
    frame: { x: 1200, y: 200, w: 660, h: 440, z: 5 }
    props: { playlistId: 01JC8Z3PLAYLIST00PROMO00, muted: true, fit: cover }
  - id: el_info
    type: text
    name: Aviso
    frame: { x: 1200, y: 680, w: 660, h: 340, z: 5 }
    props: { paragraphs: [ { runs: [ { text: 'Menú del día: {var.menu_dia}', bold: true } ] } ] }
    visibility: { days: [1, 2, 3, 4, 5], from: '12:00', to: '16:00' }
```

**Reglas del formato:**

- Coordenadas en px de la resolución de diseño (se admiten decimales). `z` ordena las capas. Cada elemento tiene un `id` estable.
- Campos comunes a todo elemento: `type`, `name`, `frame`, `props`, `style` (opcional), `visibility` (días y franja horaria, opcional), `animation` (entrada: ninguna, fundido o deslizamiento; duración), `locked`, `hidden`.
- Marcadores: `{theme.*}` (tokens del tema) y `{var.*}` (variables globales), también dentro de textos. Se resuelven en el player; si falta uno, se muestra vacío y se registra un aviso.
- Tema (`tokens_json`): `bg`, `surface`, `text`, `textMuted`, `primary`, `accent`, `danger`, `fontHeading`, `fontBody`, `radius`, escala de espaciado.
- Compatibilidad hacia delante: el player ignora props desconocidas; `schemaVersion` + cadena de migraciones en `shared` (con pruebas por versión). Límites: 200 elementos y 1 MB por diseño.
- El texto se guarda como estructura (`paragraphs` → `runs` con negrita, cursiva, subrayado, color y tamaño), **nunca como HTML crudo**, y se pinta con la API del DOM sin `innerHTML`.

### 7.3 Resolución de programación (qué se muestra ahora)

Función pura `resolveSchedule(manifest, ahora)` en `packages/shared`, usada por servidor (vista previa de calendario) y player (reproducción y modo sin conexión):

1. **Overrides** activos (pantalla, grupo, todas); gana el más específico y, a igualdad, el más reciente.
2. **Entradas de programación** activas ahora: fecha dentro del rango, día de la semana en la máscara y hora dentro de la ventana, en la zona horaria de la pantalla. Las ventanas que cruzan medianoche (22:00–02:00) se tratan como dos tramos.
3. Orden: mayor `priority`; empate → ventana más estrecha; empate → creada más recientemente.
4. Si no hay ninguna: `default_layout_id` de la pantalla; si tampoco existe, un diseño integrado «Pantalla en espera» (nombre y hora; configurable a negro).
5. Debe ser determinista y estar cubierta por una tabla de casos (cambio de hora por horario de verano, medianoche, solapes).

### 7.4 Manifiesto de pantalla

```yaml
manifestVersion: 1
hash: 'sha256:9f2c...'            # cambia solo si cambia algo relevante
server: { time: 1762700000000, protocol: 1, minPlayer: 1 }
screen: { id: 01JC..., name: Entrada, rotation: 0, scaleMode: fit, timezone: Europe/Madrid, refreshAt: '04:00', muted: false }
layouts: [ { id: 01JC..., version: 7, json: { } } ]   # solo los usados dentro del horizonte
schedule: { horizonDays: 7, defaultLayoutId: 01JC..., entries: [ ], overrides: [ ] }
media: [ { id: 01JC..., url: /media/ab12....mp4, kind: video, bytes: 8123456 } ]
data: { menus: { }, variables: { }, sources: { } }    # precios con priceText ya formateado
```

Reglas: el manifiesto es **completo** (sin diferencias) y se sirve comprimido con `ETag` igual al hash; el servidor recalcula el hash cuando cambia un diseño publicado, la programación, un menú, variable o fuente usados, o los ajustes de la pantalla; los precios viajan con `priceText` ya formateado (el player no depende de `Intl`).
