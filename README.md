# Taller de Frontend 

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
Una vez finalizada la configuracion del entorno, abrimos una nueva terminal:

![Nueva terminal](/images/NuevaTerminal.png)

 escribimos:

```bash
npm create vite@latest
```

 donde nos preguntará (esto solo aparece la primera vez):

 ```bash
Need to install the following packages:
create-vite@9.0.4
Ok to proceed? (y) 
```

escribimos `y` y despues ponemos el nombre del proyecto, en este caso `test-client`. Posteriormente aparece un selector de frameworks, con las flechas del teclado seleccionamos `React` pulsando enter y por último `TypeScript` a lo que nos preguntara lo siguiente:

```bash
◆  Install with npm and start now?
│  ● Yes / ○ No
```

Lo que pregunta es si deseas instalar las dependencias y ejecutar el entorno de desarrollo. Por ende, no afecta si eliges si o no. En este caso daremos `No`, lo que nos proporciona los siguientes comandos:

```bash
└  Done. Now run:

  cd test-client # -> Mover el directorio a la carpeta creada
  npm install # -> Instalar las dependencias del template
  npm run dev # -> Ejecutar el enotrno (visualiza la pagina web)
```

## Generación del cliente 

Primero nos movemos a la carpeta creada anteriormente (usando los comandos anteriores `cd <NOMBRE>`) y ejecutar los siguientes comandos:

```bash
npm install

npm install @solana/kit codama buffer 
```

Ahora desde Solana Playground descargaremos el IDL 

> ℹ️ Debes hacer el build y deploy del programa antes de descargar el IDL

![IDL](/images/GetIDL.png)

Y lo copiamos a la carpeta raiz del proyecto en `test-client`. Ya en VScode agregamos:

```json
"metadata":{"address":"<PROGRAM ID>"}
```

## Generar el cliente con Codama

Codama es una herramienta que describe programas de Solana usando un formato estandarizado llamado Codama IDL (Lenguaje de Definición de Interfaces).  Permite generar clientes, documentación, CLIs y más a partir del IDL de un programa, ya sea creado con Anchor, Shank o Rust.

> [ℹ️ Repositorio de Codama](https://github.com/codama-idl/codama)

>📹 [Video tutorial](https://youtu.be/Jr6Rp-EbNDc?si=zYnxkMwC94S9__B0)

Para convertir el IDL primero es necesario un generar el `codama.json` (archivo de configuración). Para ello, ejecutamos codama con el siguiente comando:

```bash
npx codama init 
```

con la posterior configuracion:

```bash
Welcome to Codama!
✔ Where is your IDL located? (Supports Codama and Anchor IDLs). … idl.json  # ℹ️ -> Escribimos la ubicacion del idl

✔ Which script preset would you like to use? › Generate JavaScript client, Generate Rust client

✔ [js] Where is the JavaScript client package located? … clients/js # ℹ️ -> Solo se da enter

✔ [rust] Where is the Rust client crate located? … clients/rust # ℹ️ -> Solo se da enter

▲ Your configuration requires additional dependencies.
▲ Install command: npm install @codama/nodes-from-anchor @codama/renderers-js @codama/renderers-rust

? Install dependencies? › (Y/n) # ℹ️ -> Escribimos "y" para instalar dependencias
```

Ya instaladas las dependecias procede con la creación del `codama.json`, si todo sale bien veremos el siguiente log:

```bash
✔ Dependencies installed successfully.

✔ Configuration file created.
  └─ Path: /workspaces/Taller-Frontend-Solana/test-client/codama.json
  ```
Con el archivo de configuracion creado, ejecutamos:

```bash
npx codama run --all
```

Lo que creará la carpeta `clients` con el cliente de TypeScript y Rust para su posterior uso.

## Integracion de cliente en el frontend

Adaptamos el `main.tsx` con el siguiente codigo:

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './Components/App' // Pon aqui donde se encuentre tu App.tsx
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import '@solana/wallet-adapter-react-ui/styles.css'

const endpoint = 'https://api.devnet.solana.com'
const wallets = [new PhantomWalletAdapter()]

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <App />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  </React.StrictMode>
)
```

en el `App.tsx` importamos lo siguiente:

```typescript
// Librerias de React y extras
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer
import { useState } from 'react'

// Librerias Web3
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  type AccountMeta as Web3AccountMeta,
} from '@solana/web3.js'
import { address } from '@solana/kit'
import type { Address, AccountMeta } from '@solana/kit'

// Imports del Cliente generado
import { getCrearBibliotecaInstruction } from '../clients/js/src/generated/instructions/crearBiblioteca' 
import { BIBLIOTECA_PROGRAM_ADDRESS } from '../clients/js/src/generated/programs/biblioteca'
```

Abajo de los imports pegamos las siguientes funciones (fuera del export App):

Convertimos las instrucciones generadas con codama (Solana/Kit) a Solana/Web3
```typescript
function kitIxToWeb3Ix(ix: {
  programAddress: Address
  accounts: readonly AccountMeta[]
  data: Uint8Array
}): TransactionInstruction {
  const keys: Web3AccountMeta[] = ix.accounts.map((acc) => ({
    pubkey: new PublicKey(acc.address),
    isSigner: acc.role === 2 || acc.role === 3,
    isWritable: acc.role === 1 || acc.role === 3,
  }))
  return new TransactionInstruction({
    programId: new PublicKey(ix.programAddress),
    keys,
    data: Buffer.from(ix.data),
  })
}
```

Posteriormente derivamos la cuenta PDA de la biblioteca
```typescript
async function derivarBibliotecaPDA(
  nBiblioteca: string, 
  ownerAddress: string
): Promise<Address> {
  const [pda] = await PublicKey.findProgramAddress(
    [ 
      Buffer.from('biblioteca'), // seeds 
      Buffer.from(nBiblioteca),
      new PublicKey(ownerAddress).toBuffer(),
    ],
    new PublicKey(BIBLIOTECA_PROGRAM_ADDRESS) // ProgramID
  )
  return address(pda.toBase58())
}
```

>⚠️ Recuerda que es importante respetar la estructura de las seeds especificadas en el Solana Program

Dentro del export App empezamos definiendo variables de estado y conexión con la devnet con lo siguiente:
```typescript
const { publicKey, connected, wallet, signTransaction, sendTransaction } = useWallet()
const { connection } = useConnection()
```

Creamos la función makeTransaction: 

```typescript 
async function makeTransaction(web3Ix: TransactionInstruction) {

    const { blockhash } = await connection.getLatestBlockhash()
    const tx = new Transaction() 
    tx.recentBlockhash = blockhash
    tx.feePayer = publicKey!
    tx.add(web3Ix) 

    const sig = await sendTransaction(tx, connection)
    setTxSig(sig) // Pasamos el id de la transacción a txSig
}
```

Y por último unimos todo en la función hanldeCrearBiblioteca:

```typescript
async function handleCrearBiblioteca() {
    // verioficación inicial
    if (!publicKey || !signTransaction || !nBiblioteca.trim()) return
  
    try {
      // Se deriva la PDA de la biblioteca
      const bibliotecaPDA = await derivarBibliotecaPDA(
        nBiblioteca.trim(),
        publicKey.toBase58()
      ) 
      // Se contruye la instruccion con codama
      const kitIx = getCrearBibliotecaInstruction({
        owner: {
          address: address(publicKey.toBase58()),
          signTransactions: async (txs) => txs.map(() => ({})) as any,
        },
        biblioteca: bibliotecaPDA,
        nBiblioteca: nBiblioteca.trim(),
      })

      // Se convierte de solana kit a web3
      const web3Ix = kitIxToWeb3Ix(kitIx as any)
    
    // Se hace la transaccion
      await makeTransaction(web3Ix)

    } catch (e) {
      setError(e)
    }      

    setLoading(false)
  }
```

> ℹ️ nBiblioteca, txSig, loading y error, son variables son hooks creados con useState.

De esta forma queda todo listo para que lo implementes en tu pagina web con botones e inputs a tu estilo :D

## ¿Cómo adapto las demas instrucciones?

Hacerlo es mas sencillo de lo que parece, solo es necesario tomar en cuenta lo siguiente:

* Necesitas importar la instrucción desde el codigo generado, todos tienen la siguiente estructura: `get<INST NAME>Instruction`
* Todas las instrucciones estan en la carpeta: `clients/js/src/generated/instructions`
* En cada instrucción (.ts) encontrarás mucho código, solo centrate en identificar los parametros de entada. Por ejemplo, en la instrucción agregarLibro:

```typescript 
export type AgregarLibroInput<
  TAccountOwner extends string = string,
  TAccountLibro extends string = string,
  TAccountBiblioteca extends string = string,
  TAccountSystemProgram extends string = string,
> = { // Con eso el codigo quiere decir que requiere:
  owner: TransactionSigner<TAccountOwner>; // el address del owner
  libro: Address<TAccountLibro>; // pda del libro
  biblioteca: Address<TAccountBiblioteca>; // pda de la biblioteca
  systemProgram?: Address<TAccountSystemProgram>; // el system program no es necesario ponerlo
  nombre: AgregarLibroInstructionDataArgs["nombre"]; // nombre: string
  paginas: AgregarLibroInstructionDataArgs["paginas"]; // paginas: int
};
```

de esta forma, y reutilizando el código ya hecho es posible adaptar `derivarBibliotecaPDA` y `kitIx` de la siguiente manera:

```typescript
// derivarLibroPDA
async function derivarLibroPDA(
  nLibro: string,
  ownerAddress: string
): Promise<Address> {
  const [pda] = await PublicKey.findProgramAddress(
    [
      Buffer.from('libro'),
      Buffer.from(nLibro),
      new PublicKey(ownerAddress).toBuffer(),
    ],
    new PublicKey(BIBLIOTECA_PROGRAM_ADDRESS)
  )
  return address(pda.toBase58())
}


//kitIx 
const kitIx = getAgregarLibroInstruction({
  owner: {
    address: address(publicKey.toBase58()),
    signTransactions: async (txs) => txs.map(() => ({})) as any,
  },
  biblioteca: bibliotecaPDA,
  libro: libroPDA,
  nombre: nBiblioteca.trim(),
  paginas: nPaginas,
})
```
