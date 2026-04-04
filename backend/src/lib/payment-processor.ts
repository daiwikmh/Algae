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

function toNetwork(network: string): Network {
    return network === 'mainnet' ? 'mainnet' : 'testnet'
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
    const iface = new algosdk.ABIInterface(arc32Json.contract)
    const method = iface.getMethodByName('processPayment')

    const atc = new algosdk.AtomicTransactionComposer()

    const xfer = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: signerAddr,
        receiver: processorAddr,
        assetIndex: usdcId,
        amount: Number(params.amountUsdc),
        suggestedParams: sp,
    })
    atc.addTransaction({ txn: xfer, signer })

    atc.addMethodCall({
        appID: appId,
        method,
        methodArgs: [
            new Uint8Array(Buffer.from(params.invoiceId)),
            new Uint8Array(Buffer.from(params.merchantId)),
            Number(params.amountUsdc),
        ],
        sender: signerAddr,
        signer,
        suggestedParams: sp,
    })

    const result = await atc.execute(algod, 4)
    const txnId = result.txIDs[1]
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
    const info = await indexer.lookupTransactionByID(params.txnId).do()
    const feeMicroAlgos = Number(info.transaction?.fee ?? 0n)
    return algosdk.microalgosToAlgos(feeMicroAlgos).toString()
}
