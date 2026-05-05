# Para detener la plataforma de grados ITP, usar el comando `./stop.sh` en la terminal. 
# Este script se encargará de detener los contenedores y liberar los recursos asociados a la plataforma.
#!/bin/bash
echo " Deteniendo Plataforma de Grados ITP..."
docker compose down
echo " Contenedores detenidos y recursos liberados"
