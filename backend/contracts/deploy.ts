import * as fs from 'fs'
import * as path from 'path'
import algosdk from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

const ARTIFACTS = path.join(__dirname, 'artifacts')
const USDC_TESTNET = 10458941
const ENV_OUT = path.join(__dirname, '..', '.env.testnet')

async function main() {
  const algorand = AlgorandClient.testNet()

  if (!process.env.DEPLOYER_MNEMONIC) {
    throw new Error('DEPLOYER_MNEMONIC not set — run: export DEPLOYER_MNEMONIC="..."')
  }
  const account = algosdk.mnemonicToSecretKey(process.env.DEPLOYER_MNEMONIC)
  const addr = account.addr.toString()
  const signer = algosdk.makeBasicAccountTransactionSigner(account)
  console.log(`Deployer: ${addr}`)

  console.log('\nDeploying MerchantRegistry...')
  const registryArc32 = JSON.parse(fs.readFileSync(path.join(ARTIFACTS, 'MerchantRegistry.arc32.json'), 'utf-8'))
  const registryFactory = algorand.client.getAppFactory({
    appSpec: registryArc32,
    defaultSender: addr,
    defaultSigner: signer,
  })
  const { appClient: registryClient } = await registryFactory.send.create({ method: 'createApplication', args: [] })
  const registryAppId = registryClient.appId
  const registryAppAddress = registryClient.appAddress
  console.log(`MerchantRegistry app_id: ${registryAppId}`)
  console.log(`MerchantRegistry address: ${registryAppAddress}`)

  console.log('\nDeploying PaymentProcessor...')
  const processorArc32 = JSON.parse(fs.readFileSync(path.join(ARTIFACTS, 'PaymentProcessor.arc32.json'), 'utf-8'))
  const processorFactory = algorand.client.getAppFactory({
    appSpec: processorArc32,
    defaultSender: addr,
    defaultSigner: signer,
  })
  const { appClient: processorClient } = await processorFactory.send.create({
    method: 'createApplication',
    args: [registryAppId, USDC_TESTNET],
  })
  const processorAppId = processorClient.appId
  const processorAppAddress = processorClient.appAddress
  console.log(`PaymentProcessor app_id: ${processorAppId}`)
  console.log(`PaymentProcessor address: ${processorAppAddress}`)

  const envLines = [
    `\nMERCHANT_REGISTRY_APP_ID=${registryAppId}`,
    `PAYMENT_PROCESSOR_APP_ID=${processorAppId}`,
    `MERCHANT_REGISTRY_ADDRESS=${registryAppAddress}`,
    `PAYMENT_PROCESSOR_ADDRESS=${processorAppAddress}`,
  ].join('\n')
  fs.appendFileSync(ENV_OUT, envLines)

  console.log(`\nDone. App IDs saved to .env.testnet`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
