import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import algosdk from 'algosdk'
import arc4Json from '../../contracts/artifacts/PaymentProcessor.arc4.json'
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

async function ensureDeployerOptedIn(
    algod: algosdk.Algodv2,
    signerAddr: string,
    signer: algosdk.TransactionSigner,
    usdcId: number,
): Promise<void> {
    const info = await algod.accountInformation(signerAddr).do()
    const assets: Array<{ assetId: bigint | number }> = (info as { assets?: Array<{ assetId: bigint | number }> }).assets ?? []
    const alreadyOptedIn = assets.some((a) => Number(a.assetId) === usdcId)
    if (alreadyOptedIn) return

    const sp = await algod.getTransactionParams().do()
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: signerAddr,
        receiver: signerAddr,
        assetIndex: usdcId,
        amount: 0,
        suggestedParams: { ...sp, fee: MIN_FEE, flatFee: true },
    })
    const atc = new algosdk.AtomicTransactionComposer()
    atc.addTransaction({ txn: optInTxn, signer })
    await atc.execute(algod, 4)
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

    await ensureDeployerOptedIn(algod, signerAddr, signer, usdcId)

    const sp = await algod.getTransactionParams().do()
    const lsig = await getGasPoolLsig(algod)
    const lsigSigner = algosdk.makeLogicSigAccountTransactionSigner(lsig)

    const iface = new algosdk.ABIInterface(arc4Json)
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
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('mx'), ...merchantBytes]) },
        ],
    })

    const result = await atc.execute(algod, 4)
    const txnId = result.txIDs[2]
    const blockRound = typeof result.confirmedRound === 'bigint'
        ? Number(result.confirmedRound)
        : Number(result.confirmedRound ?? 0)

    return { txnId, blockRound }
}

export async function buildPaymentGroup(params: {
    amountUsdc: bigint
    invoiceId: string
    merchantId: string
    network: string
    walletAddress: string
}): Promise<{ encodedTxns: string[] }> {
    const net = toNetwork(params.network)
    const algod = getAlgodClient(net)
    const { addr: signerAddr } = getDeployerAccount()
    const appId = getProcessorAppId()
    const processorAddr = getProcessorAddress()
    const usdcId = USDC_ASSET_ID[net]

    const sp = await algod.getTransactionParams().do()
    const lsig = await getGasPoolLsig(algod)
    const dummySigner: algosdk.TransactionSigner = () => Promise.resolve([])

    const iface = new algosdk.ABIInterface(arc4Json)
    const method = iface.getMethodByName('processPayment')

    const atc = new algosdk.AtomicTransactionComposer()

    atc.addTransaction({
        txn: algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            sender: lsig.address(),
            receiver: lsig.address(),
            amount: 0,
            lease: invoiceLease(params.invoiceId),
            suggestedParams: { ...sp, fee: MIN_FEE * 5, flatFee: true },
        }),
        signer: dummySigner,
    })

    atc.addTransaction({
        txn: algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            sender: params.walletAddress,
            receiver: processorAddr,
            assetIndex: usdcId,
            amount: Number(params.amountUsdc),
            suggestedParams: { ...sp, fee: 0, flatFee: true },
        }),
        signer: dummySigner,
    })

    const registryId = Number(process.env.MERCHANT_REGISTRY_APP_ID ?? '0')
    const invoiceBytes = new Uint8Array(Buffer.from(params.invoiceId))
    const merchantBytes = new Uint8Array(Buffer.from(params.merchantId))

    atc.addMethodCall({
        appID: appId,
        method,
        methodArgs: [invoiceBytes, merchantBytes, Number(params.amountUsdc)],
        sender: signerAddr,
        signer: dummySigner,
        suggestedParams: { ...sp, fee: 0, flatFee: true },
        appForeignApps: [registryId],
        boxes: [
            { appIndex: appId, name: new Uint8Array([...Buffer.from('inv'), ...invoiceBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('ma'), ...merchantBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('mc'), ...merchantBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('mx'), ...merchantBytes]) },
        ],
    })

    const group = atc.buildGroup()
    const encodedTxns = group.map((t) =>
        Buffer.from(algosdk.encodeUnsignedTransaction(t.txn)).toString('base64')
    )
    return { encodedTxns }
}

export async function submitGroupWithWalletXfer(params: {
    encodedTxns: string[]
    walletSignedXferTxn: string
    network: string
}): Promise<{ txnId: string; blockRound: number }> {
    const net = toNetwork(params.network)
    const algod = getAlgodClient(net)

    const mnemonic = process.env.DEPLOYER_MNEMONIC
    if (!mnemonic) throw new Error('DEPLOYER_MNEMONIC not set')
    const deployerAccount = algosdk.mnemonicToSecretKey(mnemonic)

    const lsig = await getGasPoolLsig(algod)

    const txn0 = algosdk.decodeUnsignedTransaction(Buffer.from(params.encodedTxns[0], 'base64'))
    const txn2 = algosdk.decodeUnsignedTransaction(Buffer.from(params.encodedTxns[2], 'base64'))

    const signed0 = algosdk.signLogicSigTransaction(txn0, lsig)
    const signed1 = new Uint8Array(Buffer.from(params.walletSignedXferTxn, 'base64'))
    const signed2 = txn2.signTxn(deployerAccount.sk)

    const sendResult = await algod.sendRawTransaction([signed0.blob, signed1, signed2]).do()
    const txid = (sendResult as { txid?: string; txId?: string }).txid ?? (sendResult as { txId?: string }).txId ?? ''

    const confirmation = await algosdk.waitForConfirmation(algod, txid, 4)
    const blockRound = typeof confirmation.confirmedRound === 'bigint'
        ? Number(confirmation.confirmedRound)
        : Number(confirmation.confirmedRound ?? 0)

    return { txnId: txid, blockRound }
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
