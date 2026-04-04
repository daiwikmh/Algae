import algosdk from 'algosdk'

export const USDC_ASSET_ID = {
    mainnet: 31566704,
    testnet: 10458941,
} as const

const ALGOD_URLS = {
    mainnet: 'https://mainnet-api.algonode.cloud',
    testnet: 'https://testnet-api.algonode.cloud',
} as const

const INDEXER_URLS = {
    mainnet: 'https://mainnet-idx.algonode.cloud',
    testnet: 'https://testnet-idx.algonode.cloud',
} as const

export function getAlgodClient(network: 'mainnet' | 'testnet'): algosdk.Algodv2 {
    return new algosdk.Algodv2('', ALGOD_URLS[network], 443)
}

export function getIndexerClient(network: 'mainnet' | 'testnet'): algosdk.Indexer {
    return new algosdk.Indexer('', INDEXER_URLS[network], 443)
}

export function getDeployerAccount(): { addr: string; signer: algosdk.TransactionSigner } {
    const mnemonic = process.env.DEPLOYER_MNEMONIC
    if (!mnemonic) throw new Error('DEPLOYER_MNEMONIC not set')
    const account = algosdk.mnemonicToSecretKey(mnemonic)
    return {
        addr: account.addr.toString(),
        signer: algosdk.makeBasicAccountTransactionSigner(account),
    }
}

export function getProcessorAppId(): number {
    const id = process.env.PAYMENT_PROCESSOR_APP_ID
    if (!id) throw new Error('PAYMENT_PROCESSOR_APP_ID not set')
    return parseInt(id, 10)
}

export function getProcessorAddress(): string {
    const addr = process.env.PAYMENT_PROCESSOR_ADDRESS
    if (!addr) throw new Error('PAYMENT_PROCESSOR_ADDRESS not set')
    return addr
}
