import algosdk from 'algosdk'
import arc32Json from '../../contracts/artifacts/MerchantRegistry.arc32.json'
import { getAlgodClient, getDeployerAccount } from './algorand'

export async function registerMerchantOnChain(params: {
    merchantId: string
    algoAddress: string
    network?: string
}): Promise<void> {
    const net = params.network === 'mainnet' ? 'mainnet' : 'testnet'
    const algod = getAlgodClient(net)
    const { addr, signer } = getDeployerAccount()

    const registryId = Number(process.env.MERCHANT_REGISTRY_APP_ID ?? '0')
    if (!registryId) throw new Error('MERCHANT_REGISTRY_APP_ID not set')

    const sp = await algod.getTransactionParams().do()
    const iface = new algosdk.ABIInterface(arc32Json.contract)
    const method = iface.getMethodByName('registerMerchant')

    const merchantBytes = new Uint8Array(Buffer.from(params.merchantId))

    const atc = new algosdk.AtomicTransactionComposer()
    atc.addMethodCall({
        appID: registryId,
        method,
        methodArgs: [merchantBytes, params.algoAddress],
        sender: addr,
        signer,
        suggestedParams: { ...sp, fee: 2000, flatFee: true },
        boxes: [
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('ma'), ...merchantBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('mc'), ...merchantBytes]) },
            { appIndex: registryId, name: new Uint8Array([...Buffer.from('mx'), ...merchantBytes]) },
        ],
    })

    await atc.execute(algod, 4)
}
