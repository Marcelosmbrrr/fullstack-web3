// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*

The visual representation (images, animations, etc.) of NFTs in your contract is not stored directly on the blockchain
Your ERC721 contract only stores: Token IDs, Ownership data, Metadata links (usually pointing to JSON files)
The actual images/videos are typically stored elsewhere, referenced via metadata - https://docs.opensea.io/docs/metadata-standards

{
  "name": "My NFT #1",
  "description": "A cool NFT",
  "image": "ipfs://QmX12...34f/metadata/1.json"
  "attributes": [...]
}

*/

contract MyToken is ERC721, ERC721Burnable, Ownable {

    // Private variable to track the next available token ID
    // Automatically increments with each new mint
    uint256 private _nextTokenId;

    // Initializes ERC721 with token name "MyToken" and symbol "MTK"
    constructor(address initialOwner)
        ERC721("MyToken", "MTK")
        Ownable(initialOwner)
    {}

    // Safe minting function to create new NFTs
    // @param to: The address that will receive the newly minted NFT
    // @return tokenId: The ID of the newly minted NFT
    function safeMint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }
}
