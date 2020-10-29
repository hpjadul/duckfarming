const { catchRevert, catchRevertMessage} = require("./exceptions.js");

const DuckToken = artifacts.require("DuckToken");
const PoolController = artifacts.require("PoolController");
const Pool = artifacts.require("Pool");
const TestToken = artifacts.require("TestToken")

const ADDRESS0 = '0x0000000000000000000000000000000000000000';
//000000000000000000
// const Pool1 = {
//   startingBlock: 0,
//   stage0: {
//     blocks: 46368,
//     farmingSupply: '3000000000000000000000000'
//   },
//   stage1: {
//     blocks: 558072,
//     farmingSupply: '2000000000000000000000000'
//   },
//   stage2: {
//     blocks: 46368,
//     farmingSupply: '3000000000000000000000000'
//   },
//   stage3: {
//     blocks: 558072,
//     farmingSupply: '2000000000000000000000000'
//   },
//   stage4: {
//     blocks: 46368,
//     farmingSupply: '3000000000000000000000000'
//   },
//   stage5: {
//     blocks: 1162512,
//     farmingSupply: '2000000000000000000000000'
//   },
//   stage6: {
//     blocks: 9671040,
//     farmingSupply: '5000000000000000000000000'
//   }
// }

const Pool1 = {
  startingBlock: 0,
  stage0: {
    blocks: 463,
    farmingSupply: '3000000000000000000000000'
  },
  stage1: {
    blocks: 5580,
    farmingSupply: '2000000000000000000000000'
  },
  stage2: {
    blocks: 463,
    farmingSupply: '3000000000000000000000000'
  },
  stage3: {
    blocks: 5580,
    farmingSupply: '2000000000000000000000000'
  },
  stage4: {
    blocks: 463,
    farmingSupply: '3000000000000000000000000'
  },
  stage5: {
    blocks: 11625,
    farmingSupply: '2000000000000000000000000'
  },
  stage6: {
    blocks: 96710,
    farmingSupply: '5000000000000000000000000'
  }
}

var bufferBlock = 0;


contract("Pool tests", accounts => {

  let currentBlock;

  let presaleWallet = accounts[7];
  let teamWallet = accounts[8];
  let devAddress = accounts[9];
  
  it("catch instances", async () => {
    try {
      DuckTokenInstance = await DuckToken.deployed();
      PoolControllerInstance = await PoolController.deployed();
      TestLPInstance1 = await TestToken.new('TestLPToken1','TestLPToken1', '1000000000000000000000');
    } catch(e) {
      assert.fail(e)
    }
    
  })

  it('check initital data', async () => {
    try {
      let expectedPresaleWalletBalance = await DuckTokenInstance.PRESALE_SUPPLY();
      let presaleWalletBalance = await DuckTokenInstance.balanceOf(presaleWallet);

      let expectedTeamWalletBalance = await DuckTokenInstance.TEAM_SUPPLY();
      let teamWalletBalance = await DuckTokenInstance.balanceOf(teamWallet);

      assert.equal(Number(presaleWalletBalance), Number(expectedPresaleWalletBalance), 'invalid initial balance')
      assert.equal(Number(teamWalletBalance), Number(expectedTeamWalletBalance), 'invalid initial balance');

      let currentTokenOwner = await DuckTokenInstance.owner();
      assert.equal(currentTokenOwner, PoolControllerInstance.address, 'invalid token owner');

    } catch(e) {
      assert.fail(e);
    }
  })

  it('create first pool', async () => {
    try {
      currentBlock = await web3.eth.getBlockNumber();
      Pool1.startingBlock = currentBlock + 100;

      let result = await PoolControllerInstance.newPool(TestLPInstance1.address, Pool1.startingBlock,
        [Pool1.stage0.blocks, Pool1.stage1.blocks, Pool1.stage2.blocks, Pool1.stage3.blocks, Pool1.stage4.blocks, Pool1.stage5.blocks, Pool1.stage6.blocks],
        [Pool1.stage0.farmingSupply, Pool1.stage1.farmingSupply, Pool1.stage2.farmingSupply, Pool1.stage3.farmingSupply,  Pool1.stage4.farmingSupply,  Pool1.stage5.farmingSupply,  Pool1.stage6.farmingSupply])

      Pool1Instance = await Pool.at(result.logs[0].args[0]);
      await Pool1Instance.updatePool();
      let period0 = await Pool1Instance.periods(0);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage0.blocks);
      assert.equal(Number(period0[2]), Pool1.stage0.farmingSupply);

      let period1 = await Pool1Instance.periods(1);
      assert.equal(Number(period1[0]), Pool1.startingBlock + Pool1.stage0.blocks + 1);
      assert.equal(Number(period1[1]), Pool1.stage1.blocks);
      assert.equal(Number(period1[2]), Pool1.stage1.farmingSupply);

      let period2 = await Pool1Instance.periods(2);
      assert.equal(Number(period2[0]), Number(period1[0]) + Number(period1[1]) + 1);
      assert.equal(Number(period2[1]), Pool1.stage2.blocks);
      assert.equal(Number(period2[2]), Pool1.stage2.farmingSupply);

      let period3 = await Pool1Instance.periods(3);
      assert.equal(Number(period3[0]), Number(period2[0]) + Number(period2[1]) + 1);
      assert.equal(Number(period3[1]), Pool1.stage3.blocks);
      assert.equal(Number(period3[2]), Pool1.stage3.farmingSupply);

      let period4 = await Pool1Instance.periods(4);
      assert.equal(Number(period4[0]), Number(period3[0]) + Number(period3[1]) + 1);
      assert.equal(Number(period4[1]), Pool1.stage4.blocks);
      assert.equal(Number(period4[2]), Pool1.stage4.farmingSupply);

      let period5 = await Pool1Instance.periods(5);
      assert.equal(Number(period5[0]), Number(period4[0]) + Number(period4[1]) + 1);
      assert.equal(Number(period5[1]), Pool1.stage5.blocks);
      assert.equal(Number(period5[2]), Pool1.stage5.farmingSupply);

      let period6 = await Pool1Instance.periods(6);
      assert.equal(Number(period6[0]), Number(period5[0]) + Number(period5[1]) + 1);
      assert.equal(Number(period6[1]), Pool1.stage6.blocks);
      assert.equal(Number(period6[2]), Pool1.stage6.farmingSupply);

    } catch(e) {
      assert.fail(e);
    }
  })

  it('check updatePool', async() => {
    try {
      await Pool1Instance.updatePool()
    } catch(e) {
      assert.fail(e)
    }
  })

  it('deposit to pool', async() => {
    try {
      await TestLPInstance1.transfer(accounts[5], '10000000000000000000');
      await TestLPInstance1.approve(Pool1Instance.address, '10000000000000000000', {from: accounts[5]});
      await Pool1Instance.deposit('1000000000000000000', {from: accounts[5]});

      await TestLPInstance1.transfer(accounts[6], '10000000000000000000');
      await TestLPInstance1.approve(Pool1Instance.address, '10000000000000000000', {from: accounts[6]});
      await Pool1Instance.deposit('2000000000000000000', {from: accounts[6]});
    } catch(e) {
      assert.fail(e)
    }
    
  })

  it('update pool then scroll time to first stage and updatePool', async() => {
    try {
      await Pool1Instance.updatePool();

      currentBlock = await web3.eth.getBlockNumber();
      for(let i = currentBlock; i < Pool1.startingBlock; i++) {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
        }, (err, result) => {
           
        });
      }

      await Pool1Instance.updatePool();
    } catch(e) {
      assert.fail(e)
    }
    
  })

  it('calculateDuckTokensForMint', async() => {
    try {
      for(let i = 0; i < 100; i++) {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
        }, (err, result) => {
           
        });
      }

      let lastRewardBlock = await Pool1Instance.lastRewardBlock()
      // console.log("lastRewardBlock: ", Number(lastRewardBlock))
      let currentBlock = await web3.eth.getBlockNumber();
      // console.log("currentBlock: ", Number(currentBlock))

      let getCurrentPeriodIndex = await Pool1Instance.getCurrentPeriodIndex()
      // console.log("getCurrentPeriodIndex: ", Number(getCurrentPeriodIndex))

      let calculateDuckTokensForMint = await Pool1Instance.calculateDuckTokensForMint()
      // console.log("calculateDuckTokensForMint: ", Number(calculateDuckTokensForMint))
    } catch(e) {
      assert.fail(e)
    }
    
  })

  it('check basic farming part', async() => {
    try {
      let contractLPBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
      // console.log(Number(contractLPBalance))
      let contractDuckBalance = await DuckTokenInstance.balanceOf(Pool1Instance.address);
      // console.log(Number(contractDuckBalance))

      
      await Pool1Instance.updatePool();
      let currentBlock = await web3.eth.getBlockNumber();

      contractDuckBalance = await DuckTokenInstance.balanceOf(Pool1Instance.address);
      // console.log("contractDuckBalance: ", Number(contractDuckBalance))
      let devDuckBalance = await DuckTokenInstance.balanceOf(devAddress);
      // console.log("devDuckBalance: ", Number(devDuckBalance))

      let blockDiff = currentBlock - Pool1.startingBlock
      // console.log("blockDiff: ", blockDiff)

      let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks;
      // console.log("rewardPerBlock: ", rewardPerBlock)

      let duckMinted = Number(contractDuckBalance) + Number(devDuckBalance);
      // console.log("duckMinted: ", Number(contractDuckBalance) + Number(devDuckBalance))

      let mustBeMinted = rewardPerBlock * blockDiff
      // console.log("mustBeMinted: ", mustBeMinted)

      // console.log(Math.floor(duckMinted/Math.pow(10,16)))
      // console.log(Math.floor(mustBeMinted/Math.pow(10,16)))

      //check without small decimals
      assert.equal(Math.floor(duckMinted/Math.pow(10,16)), Math.floor(mustBeMinted/Math.pow(10,16)))
    } catch(e) {
      assert.fail(e)
    }
    
  })

  it('withdraw part', async() => {
    try {
      let contractLPStartBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
      let user1StartLPBalance = await TestLPInstance1.balanceOf(accounts[5]);
      let user2StartLPBalance = await TestLPInstance1.balanceOf(accounts[6]);

      // console.log(Number(user1StartLPBalance))
      // console.log(Number(user2StartLPBalance))

      let user1DuckBalance1 = await DuckTokenInstance.balanceOf(accounts[5]);
      let user2DuckBalance1 = await DuckTokenInstance.balanceOf(accounts[6]);
      // console.log(Number(user1DuckBalance1))
      // console.log(Number(user2DuckBalance1))

      await Pool1Instance.updatePool();
      let contractDuckBalance = await DuckTokenInstance.balanceOf(Pool1Instance.address);
      // console.log("contractDuckBalance: ", Number(contractDuckBalance)/Math.pow(10,18))

      await catchRevertMessage(Pool1Instance.withdraw('1000000000000000001', {from: accounts[5]}), "withdraw: not good")
      await Pool1Instance.withdraw('0', {from: accounts[5]})
      await Pool1Instance.withdraw('1000000000000000000', {from: accounts[6]})
      let contractDuckBalance2 = await DuckTokenInstance.balanceOf(Pool1Instance.address);
      let user1DuckBalance = await DuckTokenInstance.balanceOf(accounts[5]);
      let user2DuckBalance = await DuckTokenInstance.balanceOf(accounts[6]);

      // console.log(Math.round(Number(contractDuckBalance2)/Math.pow(10,18)))
      // console.log(Math.round(Number(user1DuckBalance)/Math.pow(10,18)))
      // console.log(Math.round(Number(user2DuckBalance)/Math.pow(10,18)))

      // assert.equal(Math.round(Number(user1DuckBalance)/Math.pow(10,18)), 210907) //right number
      // assert.equal(Math.round(Number(user2DuckBalance)/Math.pow(10,18)), 425832) //right number

      contractDuckBalance = await await DuckTokenInstance.balanceOf(Pool1Instance.address);
      // console.log("contractDuckBalanceAfterWithdraw: ", Number(contractDuckBalance)/Math.pow(10,18))


      let contractLPFinishBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
      let user1FinishLPBalance = await TestLPInstance1.balanceOf(accounts[5]);
      let user2FinishLPBalance = await TestLPInstance1.balanceOf(accounts[6]);

      let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;
      // console.log("rewardPerBlock: ", rewardPerBlock / Math.pow(10,18))


      assert.equal(Number(contractLPStartBalance) - 1000000000000000000, Number(contractLPFinishBalance))
      assert.equal(Number(user1StartLPBalance), Number(user1FinishLPBalance))
      assert.equal(Number(user2StartLPBalance) + 1000000000000000000, Number(user2FinishLPBalance))
      //meanth account 5 got 1/3 of block reward because it have 1000000000000000000 and acc6 have 2000000000000000000
      assert.equal(Number(contractDuckBalance), rewardPerBlock / 3)
    } catch(e) {
      assert.fail(e)
    }
  })

  it('200 blocks later', async() => {

    try {
      for(let i = 0; i < 200; i++) {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
        }, (err, result) => {
           
        });
      }
      let previousDuckBalance1 = await DuckTokenInstance.balanceOf(accounts[5]);
      let previousDuckBalance2 = await DuckTokenInstance.balanceOf(accounts[6]);

      // await Pool1Instance.updatePool();
      // let contractDuckBalance = await DuckTokenInstance.balanceOf(Pool1Instance.address);
      // console.log("contractDuckBalance: ", Number(contractDuckBalance)/Math.pow(10,18))

      await Pool1Instance.withdraw('0', {from: accounts[5]})

      let user1DuckBalance = await DuckTokenInstance.balanceOf(accounts[5]);
      bufferBlock = await web3.eth.getBlockNumber();

      await Pool1Instance.withdraw('1000000000000000000', {from: accounts[6]})

      let user2DuckBalance = await DuckTokenInstance.balanceOf(accounts[6]);

      // console.log(Number(user1DuckBalance)/Math.pow(10,18));

      
      // console.log(Number(user2DuckBalance)/Math.pow(10,18)); 

      // console.log((Number(user1DuckBalance) - Number(previousDuckBalance1))/Math.pow(10,18));
      // console.log((Number(user2DuckBalance) - Number(previousDuckBalance2))/Math.pow(10,18));

      let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;
      // console.log("rewardPerBlock: ", rewardPerBlock/ Math.pow(10,18))

      let user1DiffBalance = (Number(user1DuckBalance) - Number(previousDuckBalance1))
      let user2DiffBalance = (Number(user2DuckBalance) - Number(previousDuckBalance2))

      //balances must be almost the same

      // console.log(rewardPerBlock/Math.pow(10,18))
      // console.log(user1DiffBalance/Math.pow(10,18))
      // console.log(user2DiffBalance/Math.pow(10,18))


      //balances diff must be almost the same 
      //+ 1/3 of block supply to acc5 from previous test 
      //- 1/2 of block supply to acc5 from current test
      //so acc5 balance must be equal acc6+1/3-1/2 = acc6-1/6
      assert.equal(user1DiffBalance+rewardPerBlock/6, user2DiffBalance)
    } catch(e) {
      assert.fail(e)
    }
    
  })

  it('scroll time almost to second stage', async() => {
    currentBlock = await web3.eth.getBlockNumber();
    for(let i = currentBlock; i < Pool1.startingBlock + Pool1.stage0.blocks - 10; i++) {
      web3.currentProvider.send({
        jsonrpc: "2.0",
        method: "evm_mine",
        id: new Date().getTime()
      }, (err, result) => {
         
      });
    }

    // await Pool1Instance.updatePool();
  })

  it('check period changing', async() => {
    try {
      // store current block
      //
      for(let i = 0; i < 30; i++) {
        web3.currentProvider.send({
          jsonrpc: "2.0",
          method: "evm_mine",
          id: new Date().getTime()
        }, (err, result) => {
           
        });
      }

      let user1PreviousDuckBalance1 = await DuckTokenInstance.balanceOf(accounts[5]);
      await Pool1Instance.deposit('1000000000000000000', {from: accounts[5]})
      currentBlock = await web3.eth.getBlockNumber();
      let user1DuckBalance = await DuckTokenInstance.balanceOf(accounts[5]);

      let duckDiff = (Number(user1DuckBalance) - Number(user1PreviousDuckBalance1))

      // console.log('Pool1.startingBlock + Pool1.stage0.blocks: ', Pool1.startingBlock + Pool1.stage0.blocks)
      // console.log('bufferBlock: ', bufferBlock)
      // console.log('currentBlock: ', currentBlock)

      // console.log('Pool1.startingBlock: ', Pool1.startingBlock)
      // console.log('Pool1 finishBlock: ', Pool1.startingBlock + Pool1.stage0.blocks)

      // -1 because withdrow transaction was on previous block than buffer block
      let blocksInPreviousStage = Pool1.startingBlock + Pool1.stage0.blocks - bufferBlock - 1;

      // +1 because Pool1.startingBlock + Pool1.stage0.blocks it is stil the previous stage, next stage starting in the next block
      let blocksInNewStage = currentBlock - (Pool1.startingBlock + Pool1.stage0.blocks + 1);
      // console.log('blocksInPreviousStage: ', blocksInPreviousStage)
      // console.log('blocksInNewStage: ', blocksInNewStage)


      let rewardPerPreviousBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;
      let farmedOnPreviousStage = blocksInPreviousStage * rewardPerPreviousBlock;

      let rewardPerCurrentBlock = Pool1.stage1.farmingSupply/Pool1.stage1.blocks * 0.93;
      let farmedOnCurrentStage = blocksInNewStage * rewardPerCurrentBlock

      let mustBeFarmed = farmedOnPreviousStage + farmedOnCurrentStage

      let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;

      // console.log("farmedOnPreviousStage: ", farmedOnPreviousStage / Math.pow(10,18))
      // console.log("farmedOnCurrentStage: ", farmedOnCurrentStage / Math.pow(10,18))
      // console.log("mustBeFarmed: ", mustBeFarmed / Math.pow(10,18) + rewardPerBlock / Math.pow(10,18) /2)
      // console.log('duckDiff: ', duckDiff / Math.pow(10,18))

      //they must be almost equal
      assert.equal(Math.floor(duckDiff / Math.pow(10, 16)), Math.floor(mustBeFarmed / Math.pow(10,16) + rewardPerBlock / Math.pow(10,16) /2))
    } catch(e) {
      assert.fail(e)
    }
  })

  it('withdraw all balances', async() => {
    try {
      let acc5 = await Pool1Instance.userInfo(accounts[5])

      // console.log(Number(acc5.amount))
      // console.log(Number(acc5.rewardDebt))

      await Pool1Instance.withdraw(acc5.amount, {from: accounts[5]})

      let finalPoolBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
      assert.equal(Number(finalPoolBalance), 0);
    } catch(e) {
      assert.fail(e)
    }
  })


  // it('some unit tests', async() => {
  //   try {
  //     await catchRevertMessage(Pool1Instance.addPeriod(100, 100, 50000), 'onlyFactory')
  //     await catchRevertMessage(PoolControllerInstance.addPeriod(0, 100, 100, 50000), 'two periods in the same time')
  //     await catchRevertMessage(Pool1Instance.deposit('0', {from: accounts[6]}), '_amount must be more than zero');
  //     await Pool1Instance.updatePool();
  //   } catch(e) {
  //     assert.fail(e)
  //   }
  // })
 
});





























