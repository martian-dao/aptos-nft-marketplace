# aptos-nft-marketplace
Basic NFT Marketplace built using Move modules and deployed on the Aptos blockchain.
This branch consists of changes to enable getting all events related to this contract in a single account. This has to be done because aptos doesn't have indexers yet.

Run the code using 
`npx ts-code auction_client.ts`
`npx ts-code fixed_price_client.ts`

## Supported functions:

- registerAdmin: registers an admin account. All events will be posted to this account
- listToken: lists your NFT for fixed price sale
- buyToken: buys you the said NFT for fixed price
- initAuction: initialized an auction for the desired NFT
- bid: bid on the desired NFT
- claimToken: highest bidder can claim the token from seller after the auction is over
- claimCoins: seller can claim the coins from the highest bidder after the auction is over


## Accounts:
- Seller: account that is selling their NFT
- Buyer: account that is buying an NFT
- Bidder: account that is bidding for auction
- Admin: account that will receive all the events
