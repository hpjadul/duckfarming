// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//@todo check name and symbol
contract DuckToken is ERC20("DuckToken", "DLC"), Ownable {

	uint public constant PRESALE_SUPPLY 		= 20000000e18;
	uint public constant TEAM_SUPPLY 			= 10000000e18;
	uint public constant MAX_FARMING_POOL 		= 70000000e18;

	mapping(address => bool) liquidityPools;
	uint public currentFarmingPool;

	constructor(address presaleWallet, address teamWallet) public {
		_mint(presaleWallet, PRESALE_SUPPLY);
		_mint(teamWallet, TEAM_SUPPLY);
	}
	
	function addLiquidityPool(address liquidityPool) public onlyOwner {
		liquidityPools[liquidityPool] = true;
	}

	function mint(address to, uint256 amount) public onlyOwner {
		require(currentFarmingPool.add(amount) <= MAX_FARMING_POOL, "exceed farming amount");
		currentFarmingPool += amount; 
        _mint(to, amount);
  }

  function transfer(address recipient, uint256 amount) public override returns (bool) {
  	if(liquidityPools[msg.sender]) {
  	  _burn(msg.sender, amount);
  	  return true;
  	}

  	return super.transfer(recipient, amount);
  } 
}