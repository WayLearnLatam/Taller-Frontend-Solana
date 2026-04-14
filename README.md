# Solana Hackathon con WayLearn
![Banner](./images/BannerFrontend.jpg)

En este repositorio te explicaremos como hacer un cliente de Solana y como integrarlo a un frontend apartir de un IDL generado en Solana Playground.

Solana es una blockchain de capa 1, es decir, cuenta con su propia infraestructura y no depende de otras blockchains para funcionar. Se encuentra orientada al alto rendimiento, y fue creada para soportar aplicaciones descentralizadas a gran escala con costos mínimos y confirmaciones casi inmediatas. Su diseño prioriza la eficiencia en la ejecución y la paralelización de transacciones.

Rust es el lenguaje principal para desarrollar programas en Solana. A través de él se implementa la lógica on-chain utilizando el modelo de cuentas y programas de la red, permitiendo construir contratos inteligentes seguros, eficientes y altamente optimizables.

Para facilitar el desarrollo en Rust sobre Solana existe Anchor, un framework que simplifica enormemente la creación de programas on-chain. Anchor proporciona:

* Un sistema de validación automática de cuentas mediante macros.
* Manejo simplificado de serialización y deserialización de datos.
* Gestión de PDAs (Program Derived Addresses) de forma declarativa.
* Generación automática de IDL (Interface Definition Language) para facilitar la interacción desde el frontend.
* Un entorno de testing más sencillo y estructurado.

Anchor, nos permite enfocarnos en la lógica del programa en lugar de manejar manualmente detalles de bajo nivel como validaciones repetitivas, manejo de bytes o verificación de firmas. Esto mejora la seguridad, reduce errores comunes y acelera el proceso de desarrollo.

## Preparación del entorno

Puedes comenzar dándole Fork a este repositorio (abajo te explicamos cómo 👇)

![fork](./images/fork.png)

* Puedes renombrar el repositorio a lo que sea que se ajuste con tu proyecto.
* Asegúrate de clonar este repositorio a tu cuenta usando el botón **`Fork`**.
* Presiona el botón **`<> Code`** y luego haz click en la sección **`Codespaces`**

    ![codespaces](./images/codespaces.png)

Por último, presiona **`Create codespace on master`**. Esto abrirá el proyecto en una interfaz gráfica de Visual Studio Code e instalará todas las herramientas necesarias para empezar a programar (es muy importante esperar a que este proceso termine):

![instalacion](./images/Instalacion.png)

El proceso de instalación finaliza cuando la terminal se reinicia y queda de la siguiente manera:

![fin](images/fin.png)

El `setup.sh` instala lo siguiente:

* `rust`
* dependencias para `Solana`
* `Solana-cli`
* `Anchor-cli`
* `spl-token`
* `surfpool`
* `node` y `nvm`

> ⚠️ Al terminar el proceso de preparación del entorno es necesario ejecutar el siguiente comando: 

```bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

## Creación del template de frontend con Vite

## Instalación de dependencias 

## Generar el cliente con Codama

## Integracion de cliente en el frontend