// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, RestClient, TESTNET_URL, FAUCET_URL, FaucetClient } from "./first_transaction";
import { TokenClient } from "./first_nft";

const contractAddress = '0xb511ef4c30435c0e987c8cab2fc386d0612705630067dda6e3a489d4da0e33f3';

export class AuctionClient {
  restClient: RestClient;

  constructor(restClient: RestClient) {
    this.restClient = restClient;
  }

  async submitTransactionHelper(account: Account, payload: Record<string, any>) {
    const txn_request = await this.restClient.generateTransaction(account.address(), payload)
    const signed_txn = await this.restClient.signTransaction(account, txn_request)
    const res = await this.restClient.submitTransaction(signed_txn)
    await this.restClient.waitForTransaction(res["hash"])
    return res["hash"];
  }

  async listToken(account: Account, creator: string, collectionName: string, tokenName: string, price: number) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::FixedPriceSale::list_token`,
      type_arguments: [],
      arguments: [
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        price.toString(),
        // admin
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }

  async buyToken(account: Account, seller: string, creator: string, collectionName: string, tokenName: string) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::FixedPriceSale::buy_token`,
      type_arguments: [],
      arguments: [
        seller,
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        // admin
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }
}

async function main() {
    const restClient = new RestClient(TESTNET_URL);
    const tokenClient = new TokenClient(restClient);
    const client = new AuctionClient(restClient);
    const faucet_client = new FaucetClient(FAUCET_URL, restClient);


    const seller = new Account();
    const buyer = new Account();
    const collection_name = "AptosCollection";
    const token_name = "AptosToken";

    console.log("\n=== Addresses ===");
    console.log(`Seller: ${seller.address()}`);
    console.log(`Buyer: ${buyer.address()}`);

    await faucet_client.fundAccount(seller.address(), 5000);
    await faucet_client.fundAccount(buyer.address(), 20000);

    console.log("\n=== Creating Collection and Token ===");

    await tokenClient.createCollection(seller, collection_name, "Alice's simple collection", "https://aptos.dev");
    await tokenClient.createToken(seller, collection_name, token_name, "Alice's simple token", 1, "https://aptos.dev/img/nyan.jpeg");

    console.log("\nAptosCollection and AptosToken created");

    const sellerAddress = `0x${seller.address().toString()}`;
    const creatorAddress = `0x${seller.address().toString()}`;

    console.log("\n=== Listing Token ===");
    console.log("transaction hashes");
    console.log(await client.listToken(seller, creatorAddress, collection_name, token_name, 10000)); //10 secs in microseconds

    console.log("\n=== Buying token ===");
    console.log("transaction hashes");
    console.log(await client.buyToken(buyer, sellerAddress, creatorAddress, collection_name, token_name));

    var token_balance = await tokenClient.getTokenBalance(sellerAddress, creatorAddress, collection_name, token_name);
    console.log(`\nSeller token balance: ${token_balance}`)

    token_balance = await tokenClient.getTokenBalance(buyer.address(), creatorAddress, collection_name, token_name);
    console.log(`Buyer token balance: ${token_balance}`)
    
    return "Test Completed"
}

if (require.main === module) {
  main().then((resp) => console.log(resp));
}
