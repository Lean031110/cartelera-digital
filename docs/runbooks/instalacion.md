# Runbook — Instalación y primeros pasos

> Aplica a la fase **F0** (esqueleto operativo). El asistente de primer uso y la gestión
> de pantallas llegan en F1+; este runbook instala el contenedor y verifica los
> servicios básicos.

## Requisitos

- Un servidor (físico o VPS) con Docker Engine y el plugin Compose.
- Puerto 8080 accesible desde tu PC y desde las pantallas.

## Instalación

```bash
mkdir cartelera && cd cartelera
curl -O https://raw.githubusercontent.com/Lean031110/cartelera-digital/main/docker/compose.example.yml
docker compose -f compose.example.yml up -d
docker compose -f compose.example.yml ps   # debe quedar "healthy" en ~30 s
```

## Verificación

| Qué                              | URL                                                |
| -------------------------------- | -------------------------------------------------- |
| Sonda de vida                    | `http://IP:8080/healthz` → `{"status":"ok",...}`   |
| Sonda de preparación             | `http://IP:8080/readyz` → `{"status":"ready",...}` |
| Panel de administración          | `http://IP:8080/admin`                             |
| Reproductor (pantalla en espera) | `http://IP:8080/tv`                                |

En `/tv` puedes probar el escalado con parámetros: `/tv/?name=Entrada` cambia el nombre
mostrado; `/tv/?lang=es` fija el idioma (español por defecto).

## Datos y copias de seguridad

- Todo el estado vive en el volumen `cartelera-data` (base de datos y medios).
- Copia: `docker run --rm -v cartelera_cartelera-data:/data -v "$PWD":/backup alpine tar czf /backup/cartelera-data.tgz /data`
  (el nombre exacto del volumen se ve con `docker volume ls`).
- Restaurar: mismo comando con `tar xzf`.

## Actualizar

```bash
docker compose -f compose.example.yml pull
docker compose -f compose.example.yml up -d
```

## Problemas frecuentes

| Síntoma                                              | Causa y solución                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| El contenedor arranca y muere con «no es escribible» | Volumen bind-mounted con propietario incorrecto. `sudo chown -R 1000:1000 <carpeta>` y reintenta. |
| `healthz` no responde                                | `docker logs cartelera`; comprueba que el puerto 8080 no esté ocupado (`ss -ltnp                  | grep 8080`). |
| No puedo descargar la imagen                         | La imagen es pública; si usas un registro espejo, asegúrate de que permite `ghcr.io`.             |
