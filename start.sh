# Para correr la plataforma de grados ITP, usar el comando `./start.sh` en la terminal. 
# Este script se encargará de construir las imágenes de Docker sin usar cache y luego levantar los contenedores en segundo plano.
# Este archivo es para levantar el entorno de desarrollo, si se desea levantar el entorno de producción, se debe eliminar o renombrar
# el archivo `docker-compose.override.yml` para que no sobrescriba la configuración principal del `docker-compose.yml`. y ahi si ejecutar este archivo `start.sh` para levantar el entorno de producción.

#!/bin/bash
echo " Iniciando Plataforma de Grados ITP..."
docker compose build --no-cache
docker compose up -d
echo " Contenedores levantados en segundo plano"
