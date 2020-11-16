// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
	
	constructor(string memory name, string memory symbol, uint forMint) public ERC20(name, symbol) {
		_mint(msg.sender, forMint);
	}
	
	function claimTokens(uint amount) public {
	    _mint(msg.sender, amount);
	}
}