# TableroTotal (servidor)

Servidor web para la aplicación de juegos online [TableroTotal](https://github.com/adrimr02/TableroTotal)

## Instalación para Windows
Se requiere [Node.js version 20](https://nodejs.org/dist/v20.8.0/node-v20.8.0-x64.msi) y pnpm:
```bash
iwr https://get.pnpm.io/install.ps1 -useb | iex
```

Clonar repositorio con
```bash
git clone https://github.com/adrimr02/TableroTotal_server.git
```

En el directorio clonado, instalar dependencias con
```bash
pnpm install
```

## Uso
### Desarrollo
Para iniciar el servidor en modo desarrollo, ejecutar
```bash
pnpm dev
```
### Producción
Para iniciar el servidor en modo producción, primero hay que compilarlo con
```bash
pnpm build
```
Y ejecutar
```bash
pnpm start
```
### Otros comandos útiles
- `pnpm typecheck`: Comprueba que no hay errores de tipado
- `pnpm lint`: Busca posibles errores en el código
- `pnpm format`: Formatea el código