// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./DuckToken.sol";
import "./Pool.sol";

contract PoolController is Ownable {
	
	DuckToken public duck;
	Pool[] public pools;
	
	address public devAddress;

	mapping(address => bool) public canMint;

	event NewPool(address indexed poolAddress, address lpToken);

	constructor(address _duckTokenAddress, address _devAddress) public {
		duck = DuckToken(_duckTokenAddress);
		devAddress = _devAddress;
	}

	function newPool(address lpToken, uint startingBlock, uint[] memory blocks, uint[] memory farmingSupplies) public onlyOwner {
		Pool pool = new Pool(lpToken, startingBlock, blocks, farmingSupplies);
		pools.push(pool);

		canMint[address(pool)] = true;
		duck.addLiquidityPool(lpToken);

		emit NewPool(address(pool), lpToken);
	}

	function addPeriod(uint poolIndex, uint startingBlock, uint blocks, uint farmingSupply) public onlyOwner {
		pools[poolIndex].addPeriod(startingBlock, blocks, farmingSupply);
	}

	function mint(address to, uint value) public {
		require(canMint[msg.sender], "only pools");
		duck.mint(to, value);
	}
}