import * as fs from "fs";
import * as path from "path";
import algosdk from "algosdk";
import { AlgorandClient, microAlgos } from "@algorandfoundation/algokit-utils";

async function main() {
  const network = (process.env.ALGO_NETWORK ?? "testnet") as "mainnet" | "testnet";
  const mnemonic = process.env.DEPLOYER_MNEMONIC;
  if (!mnemonic) throw new Error("DEPLOYER_MNEMONIC not set");

  const client = network === "mainnet"
    ? AlgorandClient.mainNet()
    : AlgorandClient.testNet();

  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const signer = algosdk.makeBasicAccountTransactionSigner(account);

  const arcPath = path.join(__dirname, "guardrails.arc32.json");
  if (!fs.existsSync(arcPath)) {
    throw new Error("guardrails.arc32.json not found — run: algokit compile py guardrails.py");
  }
  const arc32 = JSON.parse(fs.readFileSync(arcPath, "utf-8"));

  const appFactory = client.client.getAppFactory({
    appSpec: arc32,
    defaultSender: account.addr,
    defaultSigner: signer,
  });

  const { result } = await appFactory.deploy({
    onUpdate: "append",
    onSchemaBreak: "append",
  });

  console.log(`app_id: ${result.appId}`);
  console.log(`app_address: ${result.appAddress}`);
  console.log(`\nSet in .env.local:\nGUARDRAILS_APP_ID_${network.toUpperCase()}=${result.appId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
