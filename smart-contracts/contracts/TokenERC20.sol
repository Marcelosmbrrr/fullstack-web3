// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    
    constructor(address recipient, address initialOwner)
        ERC20("MyToken", "MTK")
        Ownable(initialOwner)
        ERC20Permit("MyToken")
    {
        // Mint initial supply to the recipient address
        // Amount is 100,000 tokens multiplied by 10 to the power of decimals (default 18)
        _mint(recipient, 100000 * 10 ** decimals());
    }

    // Function to pause all token transfers (only callable by owner)
    function pause() public onlyOwner {
        _pause();
    }

    // Function to unpause token transfers (only callable by owner)
    function unpause() public onlyOwner {
        _unpause();
    }

    // Function to mint new tokens (only callable by owner)
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Override required by Solidity when inheriting from multiple contracts with the same function
    // This combines the _update functions from both ERC20 and ERC20Pausable
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}
