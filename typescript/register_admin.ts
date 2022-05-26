// needs to be called only once

// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, RestClient, TESTNET_URL, FAUCET_URL, FaucetClient } from "./first_transaction";

const contractAddress = '0xe1ee48fdb74eccae5f6792a5a131b4282ac2ae151e4da8479cf3cafa9ffc6da1';

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

  async registerAdmin(account: Account) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::register_admin`,
      type_arguments: [],
      arguments: [
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }
}

async function main() {
    const restClient = new RestClient(TESTNET_URL);
    const client = new AuctionClient(restClient);
    const faucet_client = new FaucetClient(FAUCET_URL, restClient);

    const admin = new Account();

    console.log("\n=== Addresses ===");
    console.log(`Admin: ${admin.address()}`);

    await faucet_client.fundAccount(admin.address(), 10_000_000);

    console.log("\n=== Registering Admin ===");
    console.log("transaction hashes");
    console.log(await client.registerAdmin(admin)); //10 secs in microseconds

    return "Test Completed"
}

  if (require.main === module) {
    main().then((resp) => console.log(resp));
  }
