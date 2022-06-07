// Copyright (c) The Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { Account, RestClient, TESTNET_URL, FAUCET_URL, FaucetClient } from "./first_transaction";
import { TokenClient } from "./first_nft";

const contractAddress = '';

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

  async initAuction(account: Account, creator: string, collectionName: string, tokenName: string, minBid: number, duration: number) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::initialize_auction`,
      type_arguments: [],
      arguments: [
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        minBid.toString(),
        duration.toString(),
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }

  async bid(account: Account, seller: string, creator: string, collectionName: string, tokenName: string, bid: number) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::bid`,
      type_arguments: [],
      arguments: [
        seller,
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        bid.toString(),
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }

  async claimToken(account: Account, seller: string, creator: string, collectionName: string, tokenName: string) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::claim_token`,
      type_arguments: [],
      arguments: [
        seller,
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex")
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }

  async claimCoins(account: Account, creator: string, collectionName: string, tokenName: string) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::claim_coins`,
      type_arguments: [],
      arguments: [
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex")
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }

  async listToken(account: Account, creator: string, collectionName: string, tokenName: string, price: number) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::list_token`,
      type_arguments: [],
      arguments: [
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex"),
        price.toString()
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }

  async buyToken(account: Account, seller: string, creator: string, collectionName: string, tokenName: string) {
    const payload: { function: string; arguments: string[]; type: string; type_arguments: any[] } = {
      type: "script_function_payload",
      function: `${contractAddress}::Marketplace::buy_token`,
      type_arguments: [],
      arguments: [
        seller,
        creator,
        Buffer.from(collectionName).toString("hex"),
        Buffer.from(tokenName).toString("hex")
      ]
    };
    return await this.submitTransactionHelper(account, payload);
  }
}

async function auction() {
    const restClient = new RestClient(TESTNET_URL);
    const tokenClient = new TokenClient(restClient);
    const client = new AuctionClient(restClient);
    const faucet_client = new FaucetClient(FAUCET_URL, restClient);


    const seller = new Account();
    const bidder1 = new Account();
    const bidder2 = new Account();
    const bidder3 = new Account();
    const collection_name = "AptosCollection";
    const token_name = "AptosToken";

    console.log("\n=== Addresses ===");
    console.log(`Seller: ${seller.address()}`);
    console.log(`Bidder1: ${bidder1.address()}`);
    console.log(`Bidder2: ${bidder2.address()}`);
    console.log(`Bidder3: ${bidder3.address()}`);

    await faucet_client.fundAccount(seller.address(), 10_000_000);
    await faucet_client.fundAccount(bidder1.address(), 10_000_000);
    await faucet_client.fundAccount(bidder2.address(), 10_000_000);
    await faucet_client.fundAccount(bidder3.address(), 10_000_000);

    console.log("\n=== Creating Collection and Token ===");

    await tokenClient.createCollection(seller, collection_name, "Alice's simple collection", "https://aptos.dev");
    await tokenClient.createToken(seller, collection_name, token_name, "Alice's simple token", 1, "https://aptos.dev/img/nyan.jpeg");

    console.log("\nAptosCollection and AptosToken created");

    const sellerAddress = `0x${seller.address().toString()}`;
    const creatorAddress = `0x${seller.address().toString()}`;

    console.log("\n=== Initializing Auction ===");
    console.log("transaction hashes");
    console.log(await client.initAuction(seller, creatorAddress, collection_name, token_name, 10, 10_000_000)); //10 secs in microseconds

    console.log("\n=== Bidding on the token ===");
    console.log("transaction hashes");
    console.log(await client.bid(bidder1, sellerAddress, creatorAddress, collection_name, token_name, 8));
    console.log(await client.bid(bidder2, sellerAddress, creatorAddress, collection_name, token_name, 15));
    console.log(await client.bid(bidder3, sellerAddress, creatorAddress, collection_name, token_name, 20));

    function delay(ms: number) {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }
    await delay(10000);

    console.log("\n=== Claiming Token and Coins ===");
    console.log("transaction hashes");
    console.log(await client.claimToken(bidder1, sellerAddress, creatorAddress, collection_name, token_name));
    console.log(await client.claimToken(bidder2, sellerAddress, creatorAddress, collection_name, token_name));
    console.log(await client.claimToken(bidder3, sellerAddress, creatorAddress, collection_name, token_name));
    console.log(await client.claimCoins(seller, creatorAddress, collection_name, token_name));

    var token_balance = await tokenClient.getTokenBalance(sellerAddress, creatorAddress, collection_name, token_name);
    console.log(`\nSeller token balance: ${token_balance}`)

    token_balance = await tokenClient.getTokenBalance(bidder1.address(), creatorAddress, collection_name, token_name);
    console.log(`Bidder 1 token balance: ${token_balance}`)
    
    token_balance = await tokenClient.getTokenBalance(bidder2.address(), creatorAddress, collection_name, token_name);
    console.log(`Bidder 2 token balance: ${token_balance}`)
    
    token_balance = await tokenClient.getTokenBalance(bidder3.address(), creatorAddress, collection_name, token_name);
    console.log(`Bidder 3 token balance: ${token_balance}`)

    // const token_balance = await tokenClient.getTokenBalance('96ac91f63da8514d35c385e76aa5ab5701e5aa13978b35a836feaf31f026aef9', 'f407a02ea4af34410ca0c298eb3e7a43e56bfbc06773d32d15ac6bee5965ee23', collection_name, token_name);
    // console.log(`Bidder 3 token balance: ${token_balance}`)

    return "Test Completed"
}

async function fixed_price_sale() {
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
    fixed_price_sale().then((resp) => console.log(resp));
}
