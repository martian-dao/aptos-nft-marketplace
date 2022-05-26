# aptos-nft-marketplace
Basic NFT Marketplace built using Move modules and deployed on the Aptos blockchain.
This branch consists of changes to enable getting all events related to this contract in a single account. This has to be done because aptos doesn't have indexers yet.

## Supported functions:

- registerAdmin: registers an admin account. All events will be posted to this account
- initAuction: initializes auction for an NFT of the seller's choosing
- bid: places a bid over the desired NFT
- claim_token: claims the token from the seller's account after the auction is over. Can only be called by the winning bidder
- claim_coins: claims the coins from the highest bidder's account after the auction is over. Can only be called by the seller
- list_token: adds the NFT of the seller's choosing for fixed price sale
- buy_token: buys the NFT from the seller's account


## Accounts:
- Seller: account that is trying to sell their NFT
- Buyer: account that is trying to buy an NFT
- Admin: account that will receive all the events
