// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TestPool is ERC20, Ownable {
    IERC20 public token1;
    IERC20 public token2;
    
    constructor(address _token1Address, address _token2Address) public ERC20("TestPoolToken", "TestPoolToken") {
        token1 = IERC20(_token1Address);
        token2 = IERC20(_token2Address);
    }
    
    function deposit(uint amount) public {
        require(token1.transferFrom(msg.sender, address(this), amount));
        require(token2.transferFrom(msg.sender, address(this), amount));
        
        _mint(msg.sender, amount);
    }
    
    function withdraw(uint amount) public {
        require(balanceOf(msg.sender) >= amount);
        
        token1.transfer(msg.sender, amount);
        token2.transfer(msg.sender, amount);
        
        _burn(msg.sender, amount);
    }
}