// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./DuckToken.sol";

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
		bool isLockUp;
	}

	Period[] public periods;
	address public factory;
	uint public lastRewardBlock;
	IERC20 public lpToken;

	modifier onlyFactory() { 
		require(msg.sender == factory); 
		_; 
	}
	
	constructor(address _lpToken) public {
		factory = msg.sender;
		lpToken = IERC20(_lpToken);
	}
	
	function addPeriod(uint startingBlock, uint blocks, uint farmingSupply, bool isLockUp) public {
		uint tokensPerBlock = farmingSupply.div(blocks);
		Period memory newPeriod = Period({
			startingBlock: startingBlock,
			blocks: blocks,
			farmingSupply: farmingSupply,
			tokensPerBlock: tokensPerBlock,
			isLockUp: isLockUp
		});

		periods.push(newPeriod);
	}

	// Update reward variables of the given pool to be up-to-date.
  function updatePool() public {
		if (block.number <= lastRewardBlock) {
        return;
    }

    uint256 lpSupply = lpToken.balanceOf(address(this));
    if (lpSupply == 0) {
      lastRewardBlock = block.number;
      return;
    }

    // uint256 reward = tokensPerBlock.mul(pool.allocPoint).div(totalAllocPoint);
    // factory.mint(devaddr, sushiReward.div(10));
    // factory.mint(address(this), sushiReward);
    // pool.accSushiPerShare = pool.accSushiPerShare.add(sushiReward.mul(1e12).div(lpSupply));
    // pool.lastRewardBlock = block.number;
  }

//   function deposit(uint256 _pid, uint256 _amount) public {
//     PoolInfo storage pool = poolInfo[_pid];
//     UserInfo storage user = userInfo[_pid][msg.sender];
    
//     updatePool();
//     if (user.amount > 0) {
//         uint256 pending = user.amount.mul(pool.accSushiPerShare).div(1e12).sub(user.rewardDebt);
//         if(pending > 0) {
//             safeSushiTransfer(msg.sender, pending);
//         }
//     }
// 		if(_amount > 0) {
//         pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
//         user.amount = user.amount.add(_amount);
//     }
//     user.rewardDebt = user.amount.mul(pool.accSushiPerShare).div(1e12);
//     emit Deposit(msg.sender, _pid, _amount);
// 	}

	


  function getCurrentPeriodIndex() public view returns(uint) {
  	for(uint i = 0; i < periods.length; i++) {
  		if(block.number > periods[i].startingBlock && block.number < periods[i].startingBlock.add(periods[i].blocks)) {
  			return i;
  		}
  	}
  }

  function getTotalTokensPerBlock() public view returns(uint) {
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
}