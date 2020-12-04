// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./DuckToken.sol";
import "./PoolController.sol";

abstract contract IUniswapPool {
  address public token0;
  address public token1;
}

abstract contract IUniswapRouter {
  function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) virtual external returns (uint amountA, uint amountB);
}

contract Pool {

  using SafeMath for uint256;
  using SafeERC20 for IERC20;

 	// Info of each user.
  struct UserInfo {
    uint256 amount;     // How many LP tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
    //
    // We do some fancy math here. Basically, any point in time, the amount of SUSHIs
    // entitled to a user but is pending to be distributed is:
    //
    //   pending reward = (user.amount * pool.accSushiPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
    //   1. The pool's `accSushiPerShare` (and `lastRewardBlock`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.
  }

  // Info of each period.
	struct Period {
		uint startingBlock;
		uint blocks;
		uint farmingSupply;
		uint tokensPerBlock;
	}

  // Info of each period.
	Period[] public periods;

  // Controller address
	PoolController public controller;

  // Last block number that DUCKs distribution occurs.
	uint public lastRewardBlock;
  // The DUCK TOKEN
  ERC20Burnable public duck;
  // Address of LP token contract.
  IERC20 public lpToken;
  // Accumulated DUCKs per share, times 1e18. See below.
  uint public accDuckPerShare;

  // Info of each user that stakes LP tokens.
  mapping(address => UserInfo) public userInfo;
  
  IUniswapRouter public uniswapRouter = IUniswapRouter(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

  //Revenue part
  struct Revenue {
    address tokenAddress;
    uint totalSupply;
    uint amount;
  }
    
  // Array of created revenues
  Revenue[] public revenues;
  
  // mapping of claimed user revenues
  mapping(address => mapping(uint => bool)) revenuesClaimed;

  event Deposit(address indexed from, uint amount);
  event Withdraw(address indexed to, uint amount);
  event NewPeriod(uint indexed startingBlock, uint indexed blocks, uint farmingSupply);
  event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);

	modifier onlyController() {
		require(msg.sender == address(controller), "onlyController"); 
		_;
	}
	
	constructor(address _lpToken, uint _startingBlock, uint[] memory _blocks, uint[] memory _farmingSupplies) public {
        require(_blocks.length > 0, "emply data");
        require(_blocks.length == _farmingSupplies.length, "invalid data");
    
		controller = PoolController(msg.sender);
        duck = ERC20Burnable(controller.duck());
		lpToken = IERC20(_lpToken);

        addPeriod(_startingBlock, _blocks[0], _farmingSupplies[0]);
        uint _bufStartingBlock = _startingBlock.add(_blocks[0]).add(1);

        for(uint i = 1; i < _blocks.length; i++) {
            addPeriod(_bufStartingBlock, _blocks[i], _farmingSupplies[i]);
            _bufStartingBlock = _bufStartingBlock.add(_blocks[i]).add(1);
        }
        
        IERC20(_lpToken).approve(address(uniswapRouter), uint256(-1));
        
        // duckTokenAddress = _duckTokenAddress;
        // ddimTokenAddress = _ddimTokenAddress;

        lastRewardBlock = _startingBlock;
	}
	
  // Update a pool by adding NEW period. Can only be called by the controller.
	function addPeriod(uint startingBlock, uint blocks, uint farmingSupply) public onlyController {
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

    claimRevenue(msg.sender);
 
    uint256 lpSupply = lpToken.balanceOf(address(this));
    if (lpSupply == 0) {
      lastRewardBlock = block.number;
      return;
    }
 
    uint256 duckReward = calculateDuckTokensForMint();
    if (duckReward > 0) {
      controller.mint(controller.devAddress(), duckReward.mul(7).div(100));
      controller.mint(address(this), duckReward.mul(93).div(100));
 
      accDuckPerShare = accDuckPerShare.add(duckReward.mul(1e18).mul(93).div(100).div(lpSupply));
    }
    
    lastRewardBlock = block.number;
  }
  
  // Deposit LP tokens to Pool for DUCK allocation.
  function deposit(uint256 amount) public {
    require(amount > 0, "amount must be more than zero");
    UserInfo storage user = userInfo[msg.sender];
 
    updatePool();
 
    if (user.amount > 0) {
      uint256 pending = user.amount.mul(accDuckPerShare).div(1e18).sub(user.rewardDebt);
      if(pending > 0) {
        safeDuckTransfer(msg.sender, pending);
      }
    }
    
    user.amount = user.amount.add(amount);
    lpToken.safeTransferFrom(msg.sender, address(this), amount);
    
    user.rewardDebt = user.amount.mul(accDuckPerShare).div(1e18);
    
    emit Deposit(msg.sender, amount);
  }

   // Withdraw LP tokens from the Pool.
  function withdraw(uint256 amount) public {

    UserInfo storage user = userInfo[msg.sender];
    
    require(user.amount >= amount, "withdraw: not good");

    updatePool();
    
    uint256 pending = user.amount.mul(accDuckPerShare).div(1e18).sub(user.rewardDebt);
    if(pending > 0) {
      safeDuckTransfer(msg.sender, pending);
    }
    
    if(amount > 0) {
      // lpToken.safeTransfer(address(msg.sender), amount);
      user.amount = user.amount.sub(amount);

      uniWithdraw(msg.sender, amount);
    }
     
    user.rewardDebt = user.amount.mul(accDuckPerShare).div(1e18);
    emit Withdraw(msg.sender, amount);
  }

  function uniWithdraw(address receiver, uint lpTokenAmount) internal {
    IUniswapPool uniswapPool = IUniswapPool(address(lpToken));

    address token0 = uniswapPool.token0();
    address token1 = uniswapPool.token1();

    (uint amountA, uint amountB) = uniswapRouter.removeLiquidity(token0, token1, lpTokenAmount, 1, 1, address(this), block.timestamp + 100);

    bool isDuckBurned;
    bool token0Sent;
    bool token1Sent;
    if(token0 == address(duck)) {
        duck.burn(amountA);
        isDuckBurned = true;
        token0Sent = true;
    }

    if(token1 == address(duck)) {
        duck.burn(amountB);
        isDuckBurned = true;
        token1Sent = true;
    }
    
    if(!token0Sent) {
        if(token0 == controller.ddimTokenAddress() && !isDuckBurned) {
            IERC20(controller.ddimTokenAddress()).transfer(address(0), amountA);
        } else {
            IERC20(token0).transfer(receiver, amountA);
        }
    }
    
    if(!token1Sent) {
        if(token1 == controller.ddimTokenAddress() && !isDuckBurned) {
            IERC20(controller.ddimTokenAddress()).transfer(address(0), amountB);
        } else {
            IERC20(token1).transfer(receiver, amountB);
        }
    }
  }
  

  // Withdraw without caring about rewards. EMERGENCY ONLY.
  function emergencyWithdraw(uint256 pid) public {
    UserInfo storage user = userInfo[msg.sender];
    lpToken.safeTransfer(address(msg.sender), user.amount);
    emit EmergencyWithdraw(msg.sender, pid, user.amount);
    user.amount = 0;
    user.rewardDebt = 0;
  }

  // Get user pending reward. Frontend function..
  function getUserPendingReward(address userAddress) public view returns(uint) {
    UserInfo storage user = userInfo[userAddress];
    uint256 duckReward = calculateDuckTokensForMint();
    
    uint256 lpSupply = lpToken.balanceOf(address(this));
    if (lpSupply == 0) {
      return 0;
    }
    
    uint _accDuckPerShare = accDuckPerShare.add(duckReward.mul(1e18).mul(93).div(100).div(lpSupply));

    return user.amount.mul(_accDuckPerShare).div(1e18).sub(user.rewardDebt);
  }

  // Get current period index.
  function getCurrentPeriodIndex() public view returns(uint) {
  	for(uint i = 0; i < periods.length; i++) {
  		if(block.number > periods[i].startingBlock && block.number < periods[i].startingBlock.add(periods[i].blocks)) {
  			return i;
  		}
  	}
  }

  // Calculate DUCK Tokens for mint near current time.
  function calculateDuckTokensForMint() public view returns(uint) {
  	uint totalTokens;
  	bool overflown;

  	for(uint i = 0; i < periods.length; i++) {
  		if(block.number < periods[i].startingBlock) {
  			break;
  		}

  		uint buf = periods[i].startingBlock.add(periods[i].blocks);

  		if(block.number > buf && buf > lastRewardBlock) {
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

    return totalTokens;
  }

  // Safe duck transfer function, just in case if rounding error causes pool to not have enough DUCKs.
  function safeDuckTransfer(address to, uint256 amount) internal {
    uint256 duckBal = duck.balanceOf(address(this));
    if (amount > duckBal) {
      duck.transfer(to, duckBal);
    } else {
      duck.transfer(to, amount);
    }
  }
    
  //--------------------------------------------------------------------------------------
  //---------------------------------REVENUE PART-----------------------------------------
  //--------------------------------------------------------------------------------------
  
  // Add new Revenue, can be called only by controller
  function addRevenue(address _tokenAddress, uint _amount) public onlyController {

    Revenue memory revenue = Revenue({
      tokenAddress: _tokenAddress,
      totalSupply: lpToken.balanceOf(address(this)),
      amount: _amount
    });

    revenues.push(revenue);
  }

  // Get user last revenue. Frontend function.
  function getUserLastRevenue(address userAddress) public view returns(address, uint) {
    UserInfo storage user = userInfo[userAddress];

    for(uint i = 0; i < revenues.length; i++) {
      if(!revenuesClaimed[userAddress][i]) {
        uint userRevenue = revenues[i].amount.mul(user.amount).div(revenues[i].totalSupply);
        return (revenues[i].tokenAddress, userRevenue);
      }
    }
  }
  
    
  // claimRevenue is private function, called on updatePool for transaction caller
  function claimRevenue(address userAddress) private {
    UserInfo storage user = userInfo[userAddress];

    for(uint i = 0; i < revenues.length; i++) {
      if(!revenuesClaimed[userAddress][i]) {
        revenuesClaimed[userAddress][i] = true;
        uint userRevenue = revenues[i].amount.mul(user.amount).div(revenues[i].totalSupply);

        safeRevenueTransfer(revenues[i].tokenAddress, userAddress, userRevenue);
      }
    }
  }
    
  // Safe revenue transfer for avoid misscalculations
  function safeRevenueTransfer(address tokenAddress, address to, uint amount) private {
    uint balance = IERC20(tokenAddress).balanceOf(address(this));
    if(balance == 0 || amount == 0) {
      return;
    }

    if(balance >= amount) {
      IERC20(tokenAddress).transfer(to, amount);
    } else {
      IERC20(tokenAddress).transfer(to, balance);
    }
  }
}