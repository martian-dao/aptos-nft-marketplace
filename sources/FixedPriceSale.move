module AptosFramework::FixedPriceSale {
    use AptosFramework::Coin::{Self, Coin};
    use AptosFramework::Table::{Self, Table};
    use AptosFramework::TestCoin::TestCoin;
    use AptosFramework::Token::{Self, Token, TokenId};
    use Std::Signer;
    use Std::Event::{Self, EventHandle};

    const ERROR_INVALID_BUYER: u64 = 0;

    struct ListedItem has store, drop {
        price: u64,
        locked_token: Option<Token>,
    }

    struct CoinEscrow has key {
        locked_coins: Table<TokenId, Coin<TestCoin>>,
    }

    // Set of data sent to the event stream during a listing of a token (for fixed price)
    struct ListEvent has drop, store {
        id: TokenId,
        amount: u64,
    }

    // Set of data sent to the event stream during a buying of a token (for fixed price)
    struct BuyEvent has drop, store {
        id: TokenId,
    }

    struct ListedItemsData has key {
        listed_items: Table<TokenId, ListedItem>,
        listing_events: EventHandle<ListEvent>,
        buying_events: EventHandle<BuyEvent>,
    }

    public(script) fun list_token(sender: &signer, creator: address, collection_name: vector<u8>, name: vector<u8>, price: u64) acquires ListedItemsData{
        let token_id = Token::create_token_id_raw(creator, collection_name, name);
        let sender_addr = Signer::address_of(sender);

        if (!exists<ListedItemsData>(sender_addr)) {
            move_to(sender, ListedItemsData {
                listed_items: Table::new<TokenId, ListedItem>(),
                listing_events: Event::new_event_handle<ListEvent>(sender),
                buying_events: Event::new_event_handle<BuyEvent>(sender),
            });
        };

        let token = Token::withdraw_token(sender, token_id, 1);

        let listed_items_data = borrow_global_mut<ListedItemsData>(sender_addr);
        let listed_items = &mut listed_items_data.listed_items;

        Event::emit_event<ListEvent>(
            &mut listed_items_data.listing_events,
            ListEvent { id: token_id, amount: price },
        );

        Table::add(locked_tokens, token_id, token);
        Table::add(listed_items, token_id, ListedItem {
            price,
            locked_token: Option::some(token),
        })
    }

    public(script) fun buy_token(sender: &signer, seller: address, creator: address, collection_name: vector<u8>, name: vector<u8>) acquires ListedItemsData {
        let token_id = Token::create_token_id_raw(creator, collection_name, name);
        let sender_addr = Signer::address_of(sender);
        assert!(sender_addr != seller, ERROR_INVALID_BUYER);

        let listedItemsData = borrow_global_mut<ListedItemsData>(seller);
        Event::emit_event<BuyEvent>(
            &mut listedItemsData.buying_events,
            BuyEvent { id: token_id },
        );

        let listed_items = &mut listedItemsData.listed_items;
        let listed_item = Table::borrow_mut(listed_items, token_id);

        Coin::transfer<TestCoin>(sender, seller, listed_item.price);

        let token = Option::extract(&mut listed_item.locked_token);
        Token::deposit_token(sender, token);
        Option::destroy_none(locked_token);

        let ListedItem{price: _,} = Table::remove(listed_items, token_id);
    }
}
