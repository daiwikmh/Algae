import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import algosdk from 'algosdk'
import arc32Json from '../../contracts/artifacts/PaymentProcessor.arc32.json'
import {
    USDC_ASSET_ID,
    getAlgodClient,
    getIndexerClient,
    getDeployerAccount,
    getProcessorAppId,
    getProcessorAddress,
} from './algorand'

type Network = 'mainnet' | 'testnet'

const MIN_FEE = 1000

let _lsig: algosdk.LogicSigAccount | null = null

async function getGasPoolLsig(algod: algosdk.Algodv2): Promise<algosdk.LogicSigAccount> {
    if (_lsig) return _lsig
    const teal = fs.readFileSync(path.join(__dirname, '../../contracts/gas_pool.lsig.teal'), 'utf-8')
    const result = await algod.compile(teal).do()
    const program = new Uint8Array(Buffer.from(result.result, 'base64'))
    _lsig = new algosdk.LogicSigAccount(program)
    return _lsig
}

function toNetwork(network: string): Network {
    return network === 'mainnet' ? 'mainnet' : 'testnet'
}

function invoiceLease(invoiceId: string): Uint8Array {
    return new Uint8Array(crypto.createHash('sha256').update(invoiceId).digest())
}

export async function submitOnChainPayment(params: {
    amountUsdc: bigint
    invoiceId: string
    merchantId: string
    network: string
}): Promise<{ txnId: string; blockRound: number }> {
    const net = toNetwork(params.network)
    const algod = getAlgodClient(net)
    const { addr: signerAddr, signer } = getDeployerAccount()
    const appId = getProcessorAppId()
    const processorAddr = getProcessorAddress()
    const usdcId = USDC_ASSET_ID[net]

    const sp = await algod.getTransactionParams().do()
    const lsig = await getGasPoolLsig(algod)
    const lsigSigner = algosdk.makeLogicSigAccountTransactionSigner(lsig)

    const iface = new algosdk.ABIInterface(arc32Json.contract)
    const method = iface.getMethodByName('processPayment')

    const atc = new algosdk.AtomicTransactionComposer()

    const feeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: lsig.address(),
        receiver: lsig.address(),
        amount: 0,
        lease: invoiceLease(params.invoiceId),
        suggestedParams: { ...sp, fee: MIN_FEE * 5, flatFee: true },
    })
    atc.addTransaction({ txn: feeTxn, signer: lsigSigner })

    const xfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: signerAddr,
        receiver: processorAddr,
        assetIndex: usdcId,
        amount: Number(params.amountUsdc),
        suggestedParams: { ...sp, fee: 0, flatFee: true },
    })
    atc.addTransaction({ txn: xfer, signer })

    const registryId = Number(process.env.MERCHANT_REGISTRY_APP_ID ?? '0')
    const invoiceBytes = new Uint8Array(Buffer.from(params.invoiceId))
    const merchantBytes = new Uint8Array(Buffer.from(params.merchantId))

    atc.addMethodCall({
        appID: appId,
        method,
        methodArgs: [invoiceBytes, merchantBytes, Number(params.amountUsdc)],
        sender: signerAddr,
        signer,
        suggestedParams: { ...sp, fee: 0, flatFee: true },
        appForeignApps: [registryId],
        boxes: [
            { appIndex: appId, name: new Uint8Array([...Buffer.from('inv'), ...invoiceBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('ma'), ...merchantBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('mc'), ...merchantBytes]) },
        ],
    })

    const result = await atc.execute(algod, 4)
    const txnId = result.txIDs[2]
    const blockRound = typeof result.confirmedRound === 'bigint'
        ? Number(result.confirmedRound)
        : Number(result.confirmedRound ?? 0)

    return { txnId, blockRound }
}

export async function verifyOnChainPayment(params: {
    txnId: string
    network: string
}): Promise<boolean> {
    const net = toNetwork(params.network)
    const indexer = getIndexerClient(net)
    try {
        const info = await indexer.lookupTransactionByID(params.txnId).do()
        return !!(info.transaction?.confirmedRound)
    } catch {
        return false
    }
}

export async function getGasFeeAlgo(params: {
    txnId: string
    network: string
}): Promise<string> {
    const net = toNetwork(params.network)
    const indexer = getIndexerClient(net)
    try {
        const info = await indexer.lookupTransactionByID(params.txnId).do()
        const feeMicroAlgos = Number(info.transaction?.fee ?? 0n)
        return algosdk.microalgosToAlgos(feeMicroAlgos).toString()
    } catch {
        return '0'
    }
}
