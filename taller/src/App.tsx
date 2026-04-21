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
import { address, createSolanaRpc } from '@solana/kit'
import type { Address, AccountMeta } from '@solana/kit'

// Instrucciones del Cliente generado
import { getCrearBibliotecaInstruction } from '../clients/js/src/generated/instructions/crearBiblioteca' 
import { getAgregarLibroInstruction } from '../clients/js/src/generated/instructions/agregarLibro'
import { BIBLIOTECA_PROGRAM_ADDRESS } from '../clients/js/src/generated/programs/biblioteca'

// Funciones de fetch del cliente generado
import { fetchAllLibro, fetchBiblioteca } from '../clients/js/src/generated/accounts'

const rpc = createSolanaRpc('https://api.devnet.solana.com')

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

async function derivarBibliotecaPDA(
  nBiblioteca: string, 
  ownerAddress: string
): Promise<Address> {
  const [pda] = await PublicKey.findProgramAddress(
    [ 
      Buffer.from('biblioteca'),
      Buffer.from(nBiblioteca),
      new PublicKey(ownerAddress).toBuffer(),
    ],
    new PublicKey(BIBLIOTECA_PROGRAM_ADDRESS)
  )
  return address(pda.toBase58())
}

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

// Tipo para los libros en la UI
interface LibroUI {
  nombre: string
  paginas: number
  biblioteca: Address
  disponible: boolean
  direccion: Address
}

function App() {
  const { publicKey, sendTransaction, signTransaction } = useWallet()
  const { connection } = useConnection()
  
  // Estados para Crear Biblioteca
  const [nBiblioteca, setNBiblioteca] = useState('')
  
  // Estados para Agregar Libro
  const [nLibro, setNLibro] = useState('')
  const [numPaginas, setNumPaginas] = useState<number>(0)
  
  // Estados para Ver Libros
  const [libros, setLibros] = useState<LibroUI[]>([])
  const [mostrarLibros, setMostrarLibros] = useState(false)
  
  // Estados comunes
  const [txSig, setTxSig] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'crear' | 'agregar' | 'ver'>('crear')

  async function makeTransaction(web3Ix: TransactionInstruction) {
    if (!publicKey || !sendTransaction) throw new Error('Wallet not connected')

    const { blockhash } = await connection.getLatestBlockhash()
    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = publicKey
    tx.add(web3Ix)

    const sig = await sendTransaction(tx, connection)
    setTxSig(sig)
    return sig
  }

  async function handleCrearBiblioteca() {
    if (!publicKey || !signTransaction || !nBiblioteca.trim()) {
      setError('Por favor conecta tu wallet y ingresa un nombre para la biblioteca')
      return
    }

    setLoading(true)
    setError(null)
    setTxSig('')

    try {
      const bibliotecaPDA = await derivarBibliotecaPDA(
        nBiblioteca.trim(),
        publicKey.toBase58()
      )
      
      const kitIx = getCrearBibliotecaInstruction({
        owner: address(publicKey.toBase58()),
        biblioteca: bibliotecaPDA,
        nBiblioteca: nBiblioteca.trim(),
      })

      const web3Ix = kitIxToWeb3Ix(kitIx as any)
      await makeTransaction(web3Ix)
      
      // Limpiar el campo después de crear exitosamente
      setNBiblioteca('')

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleAgregarLibro() {
    if (!publicKey || !signTransaction || !nLibro.trim() || numPaginas <= 0) {
      setError('Por favor completa todos los campos del libro (nombre y número de páginas)')
      return
    }

    if (!nBiblioteca.trim()) {
      setError('Por favor especifica el nombre de la biblioteca existente')
      return
    }

    setLoading(true)
    setError(null)
    setTxSig('')

    try {
      const bibliotecaPDA = await derivarBibliotecaPDA(
        nBiblioteca.trim(),
        publicKey.toBase58()
      )
      
      const libroPDA = await derivarLibroPDA(
        nLibro.trim(),
        publicKey.toBase58()
      )

      const kitIx = getAgregarLibroInstruction({
        owner: address(publicKey.toBase58()),
        biblioteca: bibliotecaPDA,
        libro: libroPDA,
        paginas: numPaginas,
        nombre: nLibro.trim(),
      })

      const web3Ix = kitIxToWeb3Ix(kitIx as any)
      await makeTransaction(web3Ix)
      
      // Limpiar los campos después de agregar exitosamente
      setNLibro('')
      setNumPaginas(0)

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerLibros() {
    if (!publicKey || !nBiblioteca.trim()) {
      setError('Por favor conecta tu wallet y especifica el nombre de la biblioteca')
      return
    }
    
    setLoading(true)
    setError(null)
    setLibros([])
    setMostrarLibros(true)
    
    try {
      // 1. Derivar PDA de la biblioteca
      const bibliotecaPDA = await derivarBibliotecaPDA(
        nBiblioteca.trim(),
        publicKey.toBase58()
      )
      
      // 2. Leer cuenta biblioteca usando fetchBiblioteca del cliente generado
      const bibliotecaAccount = await fetchBiblioteca(rpc, bibliotecaPDA)
      
      // Extraer las direcciones de los libros (ajustar según la estructura real de tu cuenta)
      const libroAddresses = bibliotecaAccount.libros || bibliotecaAccount.data?.libros || []

      if (libroAddresses.length === 0) {
        setLibros([])
        return
      }
      
      // 3. Leer todas las cuentas libro usando fetchAllLibro del cliente generado
      const librosData = await fetchAllLibro(rpc, libroAddresses)

      // 4. Mapear al tipo de la UI
      const librosMapeados: LibroUI[] = librosData.map((libro, i) => ({
        nombre: libro.nombre || libro.data?.nombre || '',
        paginas: libro.paginas || libro.data?.paginas || 0,
        biblioteca: libro.biblioteca || libro.data?.biblioteca || bibliotecaPDA,
        disponible: libro.disponible ?? libro.data?.disponible ?? true,
        direccion: libroAddresses[i],
      }))
      
      setLibros(librosMapeados)
      
    } catch (e: unknown) {
      console.error('Error al ver libros:', e)
      setError(e instanceof Error ? e.message : 'Error desconocido al obtener los libros')
      setMostrarLibros(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <h1>📚 Biblioteca en Solana</h1>
        <WalletMultiButton />
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        borderBottom: '2px solid #ddd',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => {
            setActiveTab('crear')
            setError(null)
            setMostrarLibros(false)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'crear' ? '#4CAF50' : 'transparent',
            color: activeTab === 'crear' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'crear' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📖 Crear Biblioteca
        </button>
        <button
          onClick={() => {
            setActiveTab('agregar')
            setError(null)
            setMostrarLibros(false)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'agregar' ? '#2196F3' : 'transparent',
            color: activeTab === 'agregar' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'agregar' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📕 Agregar Libro
        </button>
        <button
          onClick={() => {
            setActiveTab('ver')
            setError(null)
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'ver' ? '#FF9800' : 'transparent',
            color: activeTab === 'ver' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'ver' ? 'bold' : 'normal',
            transition: 'all 0.3s ease'
          }}
        >
          📚 Ver Libros
        </button>
      </div>

      {/* Panel Crear Biblioteca */}
      {activeTab === 'crear' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Crear Nueva Biblioteca</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Nombre de la Biblioteca:
            </label>
            <input
              type="text"
              value={nBiblioteca}
              onChange={(e) => setNBiblioteca(e.target.value)}
              placeholder="Ej: Mi Biblioteca Personal"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            onClick={handleCrearBiblioteca}
            disabled={loading || !publicKey || !nBiblioteca.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !publicKey || !nBiblioteca.trim() ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading || !publicKey || !nBiblioteca.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creando...' : 'Crear Biblioteca'}
          </button>
        </div>
      )}

      {/* Panel Agregar Libro */}
      {activeTab === 'agregar' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Agregar Libro a Biblioteca</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Nombre de la Biblioteca:
            </label>
            <input
              type="text"
              value={nBiblioteca}
              onChange={(e) => setNBiblioteca(e.target.value)}
              placeholder="Nombre de la biblioteca existente"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
              La biblioteca debe haber sido creada previamente
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Título del Libro:
            </label>
            <input
              type="text"
              value={nLibro}
              onChange={(e) => setNLibro(e.target.value)}
              placeholder="Ej: El Principito"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Número de Páginas:
            </label>
            <input
              type="number"
              value={numPaginas}
              onChange={(e) => setNumPaginas(parseInt(e.target.value) || 0)}
              placeholder="Ej: 150"
              min="1"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            onClick={handleAgregarLibro}
            disabled={loading || !publicKey || !nLibro.trim() || numPaginas <= 0 || !nBiblioteca.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !publicKey || !nLibro.trim() || numPaginas <= 0 || !nBiblioteca.trim() ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading || !publicKey || !nLibro.trim() || numPaginas <= 0 || !nBiblioteca.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Agregando...' : 'Agregar Libro'}
          </button>
        </div>
      )}

      {/* Panel Ver Libros */}
      {activeTab === 'ver' && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>Ver Libros de la Biblioteca</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Nombre de la Biblioteca:
            </label>
            <input
              type="text"
              value={nBiblioteca}
              onChange={(e) => setNBiblioteca(e.target.value)}
              placeholder="Nombre de la biblioteca"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            onClick={handleVerLibros}
            disabled={loading || !publicKey || !nBiblioteca.trim()}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading || !publicKey || !nBiblioteca.trim() ? '#ccc' : '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: loading || !publicKey || !nBiblioteca.trim() ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            {loading ? 'Buscando...' : 'Buscar Libros'}
          </button>

          {/* Lista de Libros */}
          {mostrarLibros && (
            <div>
              {libros.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  color: '#666'
                }}>
                  📖 No hay libros en esta biblioteca aún
                </div>
              ) : (
                <div>
                  <h3 style={{ marginBottom: '10px' }}>
                    Libros encontrados ({libros.length})
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px' 
                  }}>
                    {libros.map((libro, index) => (
                      <div key={index} style={{
                        padding: '15px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        backgroundColor: libro.disponible ? '#f9f9f9' : '#ffebee',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                              {libro.nombre}
                            </h4>
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              <div>📄 Páginas: {libro.paginas}</div>
                              <div>✅ Estado: {libro.disponible ? 'Disponible' : 'Prestado'}</div>
                              <div style={{ fontSize: '12px', marginTop: '5px' }}>
                                📍 Dirección: {libro.direccion.toString().slice(0, 30)}...
                              </div>
                            </div>
                          </div>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor: libro.disponible ? '#4CAF50' : '#f44336',
                            color: 'white',
                            fontWeight: 'bold'
                          }}>
                            {libro.disponible ? 'Disponible' : 'No disponible'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mensajes de Error y Éxito */}
      {error && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#c62828',
          borderRadius: '4px',
          borderLeft: '4px solid #c62828'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {txSig && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          borderRadius: '4px',
          borderLeft: '4px solid #2e7d32'
        }}>
          <strong>✅ Transacción exitosa!</strong>
          <br />
          <strong>Signature:</strong>{' '}
          <a
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2e7d32', wordBreak: 'break-all' }}
          >
            {txSig.slice(0, 40)}...
          </a>
        </div>
      )}

      {/* Estado de la Wallet */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>💰 Estado de la Wallet:</strong>{' '}
        {publicKey ? (
          <span style={{ color: '#4CAF50' }}>
            ✅ Conectada: {publicKey.toBase58().slice(0, 20)}...
          </span>
        ) : (
          <span style={{ color: '#ff9800' }}>
            ⚠️ No conectada - Haz click en "Select Wallet"
          </span>
        )}
      </div>
    </div>
  )
}

export default App