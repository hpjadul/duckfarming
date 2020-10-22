// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

//@todo check name and symbol
contract DuckToken is ERC20("DuckToken", "DLC"), Ownable {

	function mint(address _to, uint256 _amount) public onlyOwner {
    _mint(_to, _amount);
  }
}