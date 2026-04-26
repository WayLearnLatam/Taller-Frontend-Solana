/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useMemo, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor"
import idl from "../idl.json"
import "./App.css"

// ── Tipos ───────
interface Empresa {
  nombre: string
  pais: string
  balance: number
  totalEnviado: number
  totalRecibido: number
  activa: boolean
}

interface TxLocal {
  sig: string
  monto: number
  fee: number
  montoNeto: number
  timestamp: string
  destino: string
}

interface Notif {
  tipo: "exito" | "error" | "info"
  mensaje: string
}

// ── App ─────────────────────────────────────────
export default function App() {
  const { publicKey, wallet } = useWallet()
  const { connection } = useConnection()

  // 🔥 HARD CODE REAL (ESTO TE SOLUCIONA TODO)
  const PROGRAM_ID = useMemo(() => {
    try {
      return new PublicKey("HRqrU1NDSXPK5JWvJTijNhs1DhvfKLRDxsn8ooXSreUm")
    } catch (e) {
      console.error("PROGRAM_ID error:", e)
      return null
    }
  }, [])

 
  const program = useMemo(() => {
    if (!wallet || !connection || !PROGRAM_ID) return null

    try {
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: "processed",
      })

      return new Program(idl as any, PROGRAM_ID, provider)
    } catch (e) {
      console.error("Error creating program:", e)
      return null
    }
  }, [wallet, connection, PROGRAM_ID])

  // ── STATES ─────────────────────────
  const [tab, setTab] = useState<"init" | "empresa" | "pagar" | "update">("init")
  const [loading, setLoading] = useState(false)
  const [notif, setNotif] = useState<Notif | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [txs, setTxs] = useState<TxLocal[]>([])
  const [txCount, setTxCount] = useState(0)

  const [fInit, setFInit] = useState({ nombre: "" })
  const [fEmp, setFEmp] = useState({ nombre: "", pais: "" })
  const [fUpd, setFUpd] = useState({ nombre: "", pais: "" })
  const [fDep, setFDep] = useState({ monto: "" })
  const [fPago, setFPago] = useState({ dest: "", monto: "" })

  const toast = (tipo: Notif["tipo"], mensaje: string) => {
    setNotif({ tipo, mensaje })
    setTimeout(() => setNotif(null), 4000)
  }

  // ── PDAs ─────────────────────────
  const getProtocoloPDA = () => {
    if (!PROGRAM_ID) return null
    return PublicKey.findProgramAddressSync([Buffer.from("protocolo")], PROGRAM_ID)[0]
  }

  const getEmpresaPDA = (owner: PublicKey) => {
    if (!PROGRAM_ID) return null
    return PublicKey.findProgramAddressSync(
      [Buffer.from("empresa"), owner.toBuffer()],
      PROGRAM_ID
    )[0]
  }

  const getTxPDA = (owner: PublicKey, count: number) => {
    if (!PROGRAM_ID) return null
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("tx"),
        owner.toBuffer(),
        new BN(count).toArrayLike(Buffer, "le", 8),
      ],
      PROGRAM_ID
    )[0]
  }

  // ── LOAD EMPRESA ─────────────────────────
  const loadEmpresa = useCallback(async () => {
    if (!program || !publicKey) return

    try {
      const empresaPDA = getEmpresaPDA(publicKey)
      if (!empresaPDA) return

      const data = await program.account.empresa.fetch(empresaPDA)

      setEmpresa({
        nombre: data.nombre,
        pais: data.pais,
        balance: Number(data.balance) / 1_000_000,
        totalEnviado: Number(data.totalEnviado),
        totalRecibido: Number(data.totalRecibido),
        activa: data.activa,
      })
    } catch {
      setEmpresa(null)
    }
  }, [program, publicKey])

  useEffect(() => {
    loadEmpresa()
  }, [loadEmpresa])

  // ── INIT ─────────────────────────
  const handleInit = async () => {
    if (!program || !publicKey) return
    if (!fInit.nombre.trim()) return toast("error", "Nombre requerido")

    const protocoloPDA = getProtocoloPDA()
    if (!protocoloPDA) return

    setLoading(true)
    try {
      await program.methods
        .initialize(fInit.nombre)
        .accounts({
          protocolo: protocoloPDA,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      toast("exito", "Protocolo inicializado")
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoading(false)
  }

  // ── REGISTER ─────────────────────────
  const handleRegEmp = async () => {
    if (!program || !publicKey) return

    const empresaPDA = getEmpresaPDA(publicKey)
    const protocoloPDA = getProtocoloPDA()

    setLoading(true)
    try {
      await program.methods
        .registerEmpresa(fEmp.nombre, fEmp.pais)
        .accounts({
          empresa: empresaPDA,
          protocolo: protocoloPDA,
          owner: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      toast("exito", "Empresa registrada")
      loadEmpresa()
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoading(false)
  }

  // ── DEPOSIT ─────────────────────────
  const handleDeposit = async () => {
    if (!program || !publicKey) return

    const monto = parseFloat(fDep.monto)
    if (!monto) return

    const empresaPDA = getEmpresaPDA(publicKey)

    setLoading(true)
    try {
      await program.methods
        .depositar(new BN(Math.floor(monto * 1_000_000)))
        .accounts({
          empresa: empresaPDA,
          owner: publicKey,
        })
        .rpc()

      toast("exito", "Depósito realizado")
      loadEmpresa()
    } catch (e: any) {
      toast("error", e.message)
    }
    setLoading(false)
  }

  // ── RENDER ─────────────────────────
  return (
    <>
      {notif && <div className={`notif notif-${notif.tipo}`}>{notif.mensaje}</div>}

      <div className="app">
        <header className="hdr">
          <div>
            <div className="logo-name">NEX<span>UM</span></div>
            <div className="logo-tag">RED DE PAGOS DESCENTRALIZADA</div>
          </div>
          <div className="wallet-wrap"><WalletMultiButton /></div>
        </header>

        {!publicKey ? (
          <div className="hero">
            <div className="hero-ttl">El puente que<br /><span>Latam necesita</span></div>
            <div className="wallet-wrap"><WalletMultiButton /></div>
          </div>
        ) : (
          <>
            <div className="tabs">
              {["init","empresa"].map((t:any)=>(
                <button key={t} className={`tab ${tab===t?"on":""}`} onClick={()=>setTab(t)}>
                  {t}
                </button>
              ))}
            </div>

            {tab==="init" && (
              <div className="panel-body">
                <input value={fInit.nombre} onChange={(e)=>setFInit({nombre:e.target.value})}/>
                <button onClick={handleInit}>Inicializar</button>
              </div>
            )}

            {tab==="empresa" && (
              <div className="panel-body">
                <input value={fEmp.nombre} onChange={(e)=>setFEmp({...fEmp,nombre:e.target.value})}/>
                <input value={fEmp.pais} onChange={(e)=>setFEmp({...fEmp,pais:e.target.value})}/>
                <button onClick={handleRegEmp}>Registrar</button>

                <input value={fDep.monto} onChange={(e)=>setFDep({monto:e.target.value})}/>
                <button onClick={handleDeposit}>Depositar</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}