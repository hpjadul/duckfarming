// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WDDIM is ERC20("WRAPPED DDIM", "WDDIM"), Ownable {

    ERC20 public DDIM = ERC20(0xFbEEa1C75E4c4465CB2FCCc9c6d6afe984558E20);

    mapping(address => bool) public liquidityPools;
    
    function claimTokens(uint amount) public {
        _mint(msg.sender, amount);
    }

    function wrap(uint amount) public {
        require(DDIM.transferFrom(msg.sender, address(this), amount));
        _mint(msg.sender, amount);
    }

    function unwrap(uint amount) public {
        _burn(msg.sender, amount);
        DDIM.transfer(msg.sender, amount);
    }

    function addLiquidityPool(address liquidityPool) public onlyOwner {
        liquidityPools[liquidityPool] = true;
    }
    
    function transfer(address recipient, uint256 amount) public override returns(bool) {
    if(liquidityPools[msg.sender]) {
      _burn(msg.sender, amount);
      DDIM.transfer(address(0), amount);
      return true;
    }

    return super.transfer(recipient, amount);
  }
  
  function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns(bool) {
    if(liquidityPools[sender]) {
      _burn(sender, amount);
      DDIM.transfer(address(0), amount);
      return true;
    }

    return super.transferFrom(sender, recipient, amount);
  } 
}