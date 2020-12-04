// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DuckToken is ERC20Burnable, Ownable {

	uint public constant PRESALE_SUPPLY 		= 20000000e18;
	uint public constant TEAM_SUPPLY 			= 10000000e18;
	uint public constant MAX_FARMING_POOL 		= 70000000e18;

	uint public currentFarmingPool;

	constructor(address presaleWallet, address teamWallet) public ERC20("DuckToken", "DLC") {
		_mint(presaleWallet, PRESALE_SUPPLY);
		_mint(teamWallet, TEAM_SUPPLY);
	}

	function mint(address to, uint256 amount) public onlyOwner {
		require(currentFarmingPool.add(amount) <= MAX_FARMING_POOL, "exceed farming amount");
		currentFarmingPool += amount; 
        _mint(to, amount);
  }
}