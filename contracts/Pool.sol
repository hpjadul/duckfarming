// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./DuckToken.sol";
import "./PoolController.sol";

contract Pool {

  using SafeMath for uint256;
  using SafeERC20 for IERC20;

 	// Info of each user.
  struct UserInfo {
    uint256 amount;     // How many LP tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
  }

	struct Period {
		uint startingBlock;
		uint blocks;
		uint farmingSupply;
		uint tokensPerBlock;
	}

	Period[] public periods;
	PoolController public controller;
	uint public lastRewardBlock;
	

  DuckToken public duck;
  IERC20 public lpToken;
  uint public lpSupply;

  uint public rewardPerShare;
  uint public accDuckPerShare;

  mapping(address => UserInfo) public userInfo;

  event Deposit(address indexed from, uint amount);
  event Withdraw(address indexed to, uint amount);
  event NewPeriod(uint indexed startingBlock, uint indexed blocks, uint farmingSupply);

	modifier onlyFactory() { 
		require(msg.sender == address(controller)); 
		_; 
	}
	
	constructor(address _lpToken, uint _startingBlock, uint[] memory _blocks, uint[] memory _farmingSupplies) public {
    require(_blocks.length > 0, "emply data");
    require(_blocks.length == _farmingSupplies.length, "invalid data");
    
		controller = PoolController(msg.sender);
		lpToken = IERC20(_lpToken);

    addPeriod(_startingBlock, _blocks[0], _farmingSupplies[0]);
    uint _bufStartingBlock = _startingBlock.add(_blocks[0]).add(1);

    for(uint i = 1; i < _blocks.length; i++) {
      addPeriod(_bufStartingBlock, _blocks[i], _farmingSupplies[i]);
      _bufStartingBlock = _bufStartingBlock.add(_blocks[i]).add(1);
    }
	}
	
	function addPeriod(uint startingBlock, uint blocks, uint farmingSupply) public onlyFactory {
    if(periods.length > 0) {
      require(startingBlock > periods[periods.length-1].startingBlock.add(periods[periods.length-1].blocks), "two periods in the same time");
    }

		uint tokensPerBlock = farmingSupply.div(blocks);
		Period memory newPeriod = Period({
			startingBlock: startingBlock,
			blocks: blocks,
			farmingSupply: farmingSupply,
			tokensPerBlock: tokensPerBlock
		});

		periods.push(newPeriod);
    emit NewPeriod(startingBlock, blocks, farmingSupply);
	}

	// Update reward variables of the given pool to be up-to-date.
  function updatePool() public {
		if (block.number <= lastRewardBlock) {
        return;
    }

    if (lpSupply == 0) {
      lastRewardBlock = block.number;
      return;
    }

    uint256 duckReward = calculateDuckTokensForMint();
    
    controller.mint(controller.devAddress(), duckReward.div(100).mul(7));
    controller.mint(address(this), duckReward.div(100).mul(93));

    accDuckPerShare = accDuckPerShare.add(duckReward.mul(1e12).div(lpSupply));
    lastRewardBlock = block.number;
  }

  function deposit(uint256 _amount) public {
    UserInfo storage user = userInfo[msg.sender];

    updatePool();
    
    if (user.amount > 0) {
      uint256 pending = user.amount.mul(accDuckPerShare).div(1e12).sub(user.rewardDebt);
      if(pending > 0) {
        safeDuckTransfer(msg.sender, pending);
      }
    }
    
    if(_amount > 0) {
      lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
      user.amount = user.amount.add(_amount);
      lpSupply = lpSupply.add(_amount);
    }
    
    user.rewardDebt = user.amount.mul(accDuckPerShare).div(1e12);
    
    emit Deposit(msg.sender, _amount);
  }

  function withdraw(uint256 _amount) public {
    UserInfo storage user = userInfo[msg.sender];
    
    require(user.amount >= _amount, "withdraw: not good");
    updatePool();
    
    uint256 pending = user.amount.mul(accDuckPerShare).div(1e12).sub(user.rewardDebt);
    
    if(pending > 0) {
      safeDuckTransfer(msg.sender, pending);
    }
    
    if(_amount > 0) {
      user.amount = user.amount.sub(_amount);
      lpToken.safeTransfer(address(msg.sender), _amount);
    }
    
    user.rewardDebt = user.amount.mul(accDuckPerShare).div(1e12);
    emit Withdraw(msg.sender, _amount);
  }

  function getCurrentPeriodIndex() public view returns(uint) {
  	for(uint i = 0; i < periods.length; i++) {
  		if(block.number > periods[i].startingBlock && block.number < periods[i].startingBlock.add(periods[i].blocks)) {
  			return i;
  		}
  	}
  }

  function calculateDuckTokensForMint() public view returns(uint) {
  	uint totalTokens;
  	bool overflown;

  	//@todo double check this
  	for(uint i = 0; i < periods.length; i++) {
  		if(lastRewardBlock < periods[i].startingBlock) {
  			continue;
  		}

  		uint buf = periods[i].startingBlock.add(periods[i].blocks);

  		if(block.number > buf) {
  			totalTokens += buf.sub(lastRewardBlock).mul(periods[i].tokensPerBlock);
  			overflown = true;
  		} else {
  			if(overflown) {
  				totalTokens += block.number.sub(periods[i].startingBlock).mul(periods[i].tokensPerBlock);
  			} else {
  				totalTokens += block.number.sub(lastRewardBlock).mul(periods[i].tokensPerBlock);
  			}

  			break;
  		}
  	}
  }

  // Safe duck transfer function, just in case if rounding error causes pool to not have enough DUCKs.
  function safeDuckTransfer(address _to, uint256 _amount) internal {
    uint256 duckBal = duck.balanceOf(address(this));
    if (_amount > duckBal) {
      duck.transfer(_to, duckBal);
    } else {
      duck.transfer(_to, _amount);
    }
  }

}