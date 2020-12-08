const { catchRevert, catchRevertMessage} = require("./exceptions.js");

const DuckToken = artifacts.require("DuckToken");
const PoolController = artifacts.require("PoolController");
const Pool = artifacts.require("Pool");
const TestToken = artifacts.require("TestToken")

const ADDRESS0 = '0x0000000000000000000000000000000000000000';
//@TODO remove all commented lines

//000000000000000000
const Pool1 = {
  startingBlock: 0,
  stage0: {
    blocks: 46368,
    farmingSupply: '3000000000000000000000000'
  },
  stage1: {
    blocks: 558072,
    farmingSupply: '2000000000000000000000000'
  },
  stage2: {
    blocks: 46368,
    farmingSupply: '3000000000000000000000000'
  },
  stage3: {
    blocks: 558072,
    farmingSupply: '2000000000000000000000000'
  },
  stage4: {
    blocks: 46368,
    farmingSupply: '3000000000000000000000000'
  },
  stage5: {
    blocks: 1162512,
    farmingSupply: '2000000000000000000000000'
  },
  stage6: {
    blocks: 9671040,
    farmingSupply: '5000000000000000000000000'
  }
}

// [46368, 558072, 46368, 558072, 46368, 1162512 , 9671040]
// ["3000000000000000000000000", "2000000000000000000000000", "3000000000000000000000000", "2000000000000000000000000", "3000000000000000000000000", "2000000000000000000000000", "5000000000000000000000000"]
// TESTTOKEN - 0xD7311B90c2AD9c989f8D9CbfA415F1157c18283C
// DUCKTOKEN - 0xaC4D794d305C453C62332FEFbBC71a7ab832d053
// POOLCONTROLLER - 0xB4e9840008816564b018bdac7cBf6Fb1262dED75
// POOL1 - 0xF7E15656BE9D3A981f1985da759153C390A018D3
// POOL2 - 0x15D8E00691f6ACD75c031e1c3A3402c056726237
// POOL3 - 0x1B0b232D7d2B53927aFb5459598bdd89a9F40135


// DUCK - 0x192baC49Dc03D69c482Aa48DA001e03B259Fa8Bb
// DDIM - 0xA2E33097353f87Edd1B212E82610C9971DC0Dd50
// CONTROLLER - 0xC633917f84eea9Bc1C04E80E5b82f85dBb595cA1
// POOL_TOKEN (ETH - DUCK) - 0x10752635857291445bff418ac04f60361da5b564
// POOL(ETH - DUCK) - 0x0963d20C7C5EDfB7dF9a4efDe065cF1555608388
// https://rinkeby.etherscan.io/tx/0xfb578ca06b3d93cdda9f99e52a4adede6c91bb2e2e660fa872d4f1f94ea4e9f5

// POOL_TOKEN (ETH - DDIM) - 0x5539571f5f06c2607db24e1fe33579a34bea3440
// POOL(ETH - DDIM) - 0x195D86F7c1c94aef38e831DD9952BCaD6Fcf9181
// https://rinkeby.etherscan.io/tx/0xafca29e87669a0a22b3123d2e334dc7eb1b1d1d81a77b2d4d94bb53eb078da11

// POOL_TOKEN (DUCK - DDIM) - 0x63d2bc7257b6471195043c85fc834e142ef56b9a
// POOL(DUCK - DDIM) - 0xCaDa46B2dAE3B4f9b03B63f5130174164475f836
// https://rinkeby.etherscan.io/tx/0x833601e7aea476c739be9a22f23dcf315dad3ed9b8b9d04290c7d1af2e8ec92c

// const Pool1 = {
//   startingBlock: 0,
//   stage0: {
//     blocks: 463,
//     farmingSupply: '3000000000000000000000000'
//   },
//   stage1: {
//     blocks: 5580,
//     farmingSupply: '2000000000000000000000000'
//   },
//   stage2: {
//     blocks: 463,
//     farmingSupply: '3000000000000000000000000'
//   },
//   stage3: {
//     blocks: 5580,
//     farmingSupply: '2000000000000000000000000'
//   },
//   stage4: {
//     blocks: 463,
//     farmingSupply: '3000000000000000000000000'
//   },
//   stage5: {
//     blocks: 11625,
//     farmingSupply: '2000000000000000000000000'
//   },
//   stage6: {
//     blocks: 96710,
//     farmingSupply: '5000000000000000000000000'
//   }
// }

var bufferBlock = 0;

//withdraw part tested manually. Too hard to fork uniswap on our testnet
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
      TestUSDTInstance = await TestToken.new('TestUSDT','TestUSDT', '1000000000000000000000');
      TestUSDCInstance = await TestToken.new('TestUSDC','TestUSDC', '1000000000000000000000');
      TestDAIInstance = await TestToken.new('TestDAI','TestDAI', '1000000000000000000000');
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
    // try {
      currentBlock = await web3.eth.getBlockNumber();
      Pool1.startingBlock = currentBlock + 100;

      let result = await PoolControllerInstance.newPool(TestLPInstance1.address, Pool1.startingBlock,
        [Pool1.stage0.blocks, Pool1.stage1.blocks, Pool1.stage2.blocks, Pool1.stage3.blocks, Pool1.stage4.blocks, Pool1.stage5.blocks, Pool1.stage6.blocks],
        [Pool1.stage0.farmingSupply, Pool1.stage1.farmingSupply, Pool1.stage2.farmingSupply, Pool1.stage3.farmingSupply,  Pool1.stage4.farmingSupply,  Pool1.stage5.farmingSupply,  Pool1.stage6.farmingSupply])

      Pool1Instance = await Pool.at(result.logs[0].args[0]);
      await Pool1Instance.updatePool();

      let period0 = await Pool1Instance.periods(0);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage0.blocks-1);
      assert.equal(Number(period0[2]), Pool1.stage0.farmingSupply);

      let period1 = await Pool1Instance.periods(1);
      assert.equal(Number(period1[0]), Pool1.startingBlock + Pool1.stage0.blocks);
      assert.equal(Number(period1[1]), Pool1.stage1.blocks-1);
      assert.equal(Number(period1[2]), Pool1.stage1.farmingSupply);

      let period2 = await Pool1Instance.periods(2);
      assert.equal(Number(period2[0]), Number(period1[0]) + Number(period1[1])+1);
      assert.equal(Number(period2[1]), Pool1.stage2.blocks-1);
      assert.equal(Number(period2[2]), Pool1.stage2.farmingSupply);

      let period3 = await Pool1Instance.periods(3);
      assert.equal(Number(period3[0]), Number(period2[0]) + Number(period2[1])+1);
      assert.equal(Number(period3[1]), Pool1.stage3.blocks-1);
      assert.equal(Number(period3[2]), Pool1.stage3.farmingSupply);

      let period4 = await Pool1Instance.periods(4);
      assert.equal(Number(period4[0]), Number(period3[0]) + Number(period3[1])+1);
      assert.equal(Number(period4[1]), Pool1.stage4.blocks-1);
      assert.equal(Number(period4[2]), Pool1.stage4.farmingSupply);

      let period5 = await Pool1Instance.periods(5);
      assert.equal(Number(period5[0]), Number(period4[0]) + Number(period4[1])+1);
      assert.equal(Number(period5[1]), Pool1.stage5.blocks-1);
      assert.equal(Number(period5[2]), Pool1.stage5.farmingSupply);
      let period6 = await Pool1Instance.periods(6);
      assert.equal(Number(period6[0]), Number(period5[0]) + Number(period5[1])+1);

      assert.equal(Number(period6[1]), Pool1.stage6.blocks-1);
      assert.equal(Number(period6[2]), Pool1.stage6.farmingSupply);

    // } catch(e) {
    //   assert.fail(e);
    // }
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

      let rewardPerBlock = Pool1.stage0.farmingSupply/(Pool1.stage0.blocks);
      // console.log("rewardPerBlock: ", rewardPerBlock)

      let duckMinted = Number(contractDuckBalance) + Number(devDuckBalance);
      // console.log("duckMinted: ", Number(contractDuckBalance) + Number(devDuckBalance))

      let mustBeMinted = rewardPerBlock * blockDiff
      // console.log("mustBeMinted: ", mustBeMinted)

      // console.log(Math.floor(duckMinted))
      // console.log(Math.floor(duckMinted/Math.pow(10,16)))
      // console.log(Math.floor(mustBeMinted/Math.pow(10,16)))

      //check without small decimals
      assert.equal(Math.floor(duckMinted/Math.pow(10,16)), Math.floor(mustBeMinted/Math.pow(10,16)))
    } catch(e) {
      assert.fail(e)
    }
    
  })

  // it('withdraw part', async() => {
  //   try {
  //     let contractLPStartBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
  //     let user1StartLPBalance = await TestLPInstance1.balanceOf(accounts[5]);
  //     let user2StartLPBalance = await TestLPInstance1.balanceOf(accounts[6]);

  //     // console.log(Number(user1StartLPBalance))
  //     // console.log(Number(user2StartLPBalance))

  //     let user1DuckBalance1 = await DuckTokenInstance.balanceOf(accounts[5]);
  //     let user2DuckBalance1 = await DuckTokenInstance.balanceOf(accounts[6]);
  //     // console.log(Number(user1DuckBalance1))
  //     // console.log(Number(user2DuckBalance1))

  //     await Pool1Instance.updatePool();
  //     let contractDuckBalance = await DuckTokenInstance.balanceOf(Pool1Instance.address);
  //     // console.log("contractDuckBalance: ", Number(contractDuckBalance)/Math.pow(10,18))

  //     await catchRevertMessage(Pool1Instance.withdraw('1000000000000000001', {from: accounts[5]}), "withdraw: not good")
  //     await Pool1Instance.withdraw('0', {from: accounts[5]})
  //     await Pool1Instance.withdraw('1000000000000000000', {from: accounts[6]})
  //     let contractDuckBalance2 = await DuckTokenInstance.balanceOf(Pool1Instance.address);
  //     let user1DuckBalance = await DuckTokenInstance.balanceOf(accounts[5]);
  //     let user2DuckBalance = await DuckTokenInstance.balanceOf(accounts[6]);

  //     // console.log(Math.round(Number(contractDuckBalance2)/Math.pow(10,18)))
  //     // console.log(Math.round(Number(user1DuckBalance)/Math.pow(10,18)))
  //     // console.log(Math.round(Number(user2DuckBalance)/Math.pow(10,18)))

  //     // assert.equal(Math.round(Number(user1DuckBalance)/Math.pow(10,18)), 210907) //right number
  //     // assert.equal(Math.round(Number(user2DuckBalance)/Math.pow(10,18)), 425832) //right number

  //     contractDuckBalance = await await DuckTokenInstance.balanceOf(Pool1Instance.address);
  //     // console.log("contractDuckBalanceAfterWithdraw: ", Number(contractDuckBalance)/Math.pow(10,18))


  //     let contractLPFinishBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
  //     let user1FinishLPBalance = await TestLPInstance1.balanceOf(accounts[5]);
  //     let user2FinishLPBalance = await TestLPInstance1.balanceOf(accounts[6]);

  //     let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;
  //     // console.log("rewardPerBlock: ", rewardPerBlock / Math.pow(10,18))


  //     assert.equal(Number(contractLPStartBalance) - 1000000000000000000, Number(contractLPFinishBalance))
  //     assert.equal(Number(user1StartLPBalance), Number(user1FinishLPBalance))
  //     assert.equal(Number(user2StartLPBalance) + 1000000000000000000, Number(user2FinishLPBalance))
  //     // meanth account 5 got 1/3 of block reward because it have 1000000000000000000 and acc6 have 2000000000000000000
  //     assert.equal(Number(contractDuckBalance), rewardPerBlock / 3)
  //   } catch(e) {
  //     assert.fail(e)
  //   }
  // })

  // it('200 blocks later', async() => {

  //   try {
  //     for(let i = 0; i < 200; i++) {
  //       web3.currentProvider.send({
  //         jsonrpc: "2.0",
  //         method: "evm_mine",
  //         id: new Date().getTime()
  //       }, (err, result) => {
           
  //       });
  //     }
  //     let previousDuckBalance1 = await DuckTokenInstance.balanceOf(accounts[5]);
  //     let previousDuckBalance2 = await DuckTokenInstance.balanceOf(accounts[6]);

  //     // await Pool1Instance.updatePool();
  //     // let contractDuckBalance = await DuckTokenInstance.balanceOf(Pool1Instance.address);
  //     // console.log("contractDuckBalance: ", Number(contractDuckBalance)/Math.pow(10,18))

  //     await Pool1Instance.withdraw('0', {from: accounts[5]})

  //     let user1DuckBalance = await DuckTokenInstance.balanceOf(accounts[5]);
  //     bufferBlock = await web3.eth.getBlockNumber();

  //     await Pool1Instance.withdraw('1000000000000000000', {from: accounts[6]})

  //     let user2DuckBalance = await DuckTokenInstance.balanceOf(accounts[6]);

  //     // console.log(Number(user1DuckBalance)/Math.pow(10,18));

      
  //     // console.log(Number(user2DuckBalance)/Math.pow(10,18)); 

  //     // console.log((Number(user1DuckBalance) - Number(previousDuckBalance1))/Math.pow(10,18));
  //     // console.log((Number(user2DuckBalance) - Number(previousDuckBalance2))/Math.pow(10,18));

  //     let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;
  //     // console.log("rewardPerBlock: ", rewardPerBlock/ Math.pow(10,18))

  //     let user1DiffBalance = (Number(user1DuckBalance) - Number(previousDuckBalance1))
  //     let user2DiffBalance = (Number(user2DuckBalance) - Number(previousDuckBalance2))

  //     //balances must be almost the same

  //     // console.log(rewardPerBlock/Math.pow(10,18))
  //     // console.log(user1DiffBalance/Math.pow(10,18))
  //     // console.log(user2DiffBalance/Math.pow(10,18))


  //     //balances diff must be almost the same 
  //     //+ 1/3 of block supply to acc5 from previous test 
  //     //- 1/2 of block supply to acc5 from current test
  //     //so acc5 balance must be equal acc6+1/3-1/2 = acc6-1/6
  //     assert.equal(user1DiffBalance+rewardPerBlock/6, user2DiffBalance)
  //   } catch(e) {
  //     assert.fail(e)
  //   }
    
  // })

  // it('scroll time almost to second stage', async() => {
  //   currentBlock = await web3.eth.getBlockNumber();
  //   for(let i = currentBlock; i < Pool1.startingBlock + Pool1.stage0.blocks - 10; i++) {
  //     web3.currentProvider.send({
  //       jsonrpc: "2.0",
  //       method: "evm_mine",
  //       id: new Date().getTime()
  //     }, (err, result) => {
         
  //     });
  //   }

  //   // await Pool1Instance.updatePool();
  // })

  // it('check period changing', async() => {
  //   try {
  //     // store current block
  //     //
  //     for(let i = 0; i < 30; i++) {
  //       web3.currentProvider.send({
  //         jsonrpc: "2.0",
  //         method: "evm_mine",
  //         id: new Date().getTime()
  //       }, (err, result) => {
           
  //       });
  //     }

  //     let user1PreviousDuckBalance1 = await DuckTokenInstance.balanceOf(accounts[5]);
  //     await Pool1Instance.deposit('1000000000000000000', {from: accounts[5]})
  //     currentBlock = await web3.eth.getBlockNumber();
  //     let user1DuckBalance = await DuckTokenInstance.balanceOf(accounts[5]);

  //     let duckDiff = (Number(user1DuckBalance) - Number(user1PreviousDuckBalance1))

  //     // console.log('Pool1.startingBlock + Pool1.stage0.blocks: ', Pool1.startingBlock + Pool1.stage0.blocks)
  //     // console.log('bufferBlock: ', bufferBlock)
  //     // console.log('currentBlock: ', currentBlock)

  //     // console.log('Pool1.startingBlock: ', Pool1.startingBlock)
  //     // console.log('Pool1 finishBlock: ', Pool1.startingBlock + Pool1.stage0.blocks)

  //     // -1 because withdrow transaction was on previous block than buffer block
  //     let blocksInPreviousStage = Pool1.startingBlock + Pool1.stage0.blocks - bufferBlock - 1;

  //     // +1 because Pool1.startingBlock + Pool1.stage0.blocks it is stil the previous stage, next stage starting in the next block
  //     let blocksInNewStage = currentBlock - (Pool1.startingBlock + Pool1.stage0.blocks + 1);
  //     // console.log('blocksInPreviousStage: ', blocksInPreviousStage)
  //     // console.log('blocksInNewStage: ', blocksInNewStage)


  //     let rewardPerPreviousBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;
  //     let farmedOnPreviousStage = blocksInPreviousStage * rewardPerPreviousBlock;

  //     let rewardPerCurrentBlock = Pool1.stage1.farmingSupply/Pool1.stage1.blocks * 0.93;
  //     let farmedOnCurrentStage = blocksInNewStage * rewardPerCurrentBlock

  //     let mustBeFarmed = farmedOnPreviousStage + farmedOnCurrentStage

  //     let rewardPerBlock = Pool1.stage0.farmingSupply/Pool1.stage0.blocks * 0.93;

  //     // console.log("farmedOnPreviousStage: ", farmedOnPreviousStage / Math.pow(10,18))
  //     // console.log("farmedOnCurrentStage: ", farmedOnCurrentStage / Math.pow(10,18))
  //     // console.log("mustBeFarmed: ", mustBeFarmed / Math.pow(10,18) + rewardPerBlock / Math.pow(10,18) /2)
  //     // console.log('duckDiff: ', duckDiff / Math.pow(10,18))

  //     //they must be almost equal
  //     assert.equal(Math.floor(duckDiff / Math.pow(10, 16)), Math.floor(mustBeFarmed / Math.pow(10,16) + rewardPerBlock / Math.pow(10,16) /2))
  //   } catch(e) {
  //     assert.fail(e)
  //   }
  // })

  // it('withdraw all balances', async() => {
  //   try {
  //     let acc5 = await Pool1Instance.userInfo(accounts[5])
  //     await Pool1Instance.withdraw(acc5.amount, {from: accounts[5]})

  //     let finalPoolBalance = await TestLPInstance1.balanceOf(Pool1Instance.address);
  //     assert.equal(Number(finalPoolBalance), 0);
  //   } catch(e) {
  //     assert.fail(e)
  //   }
  // })


  it('some unit tests', async() => {
    try {
      await catchRevertMessage(Pool1Instance.addPeriod(100, 100, 50000), 'onlyController')
      await catchRevertMessage(PoolControllerInstance.addPeriod(0, 100, 100, 50000), 'two periods in the same time')
      await catchRevertMessage(Pool1Instance.deposit('0', {from: accounts[6]}), 'amount must be more than zero');
      await Pool1Instance.updatePool();
    } catch(e) {
      assert.fail(e)
    }
  })

  it('revenue part', async() => {
    try {

      //deposit again
      await TestLPInstance1.transfer(accounts[5], '10000000000000000000');
      await TestLPInstance1.approve(Pool1Instance.address, '10000000000000000000', {from: accounts[5]});
      await Pool1Instance.deposit('500000000000000000', {from: accounts[5]});

      await TestLPInstance1.transfer(accounts[6], '10000000000000000000');
      await TestLPInstance1.approve(Pool1Instance.address, '10000000000000000000', {from: accounts[6]});
      await Pool1Instance.deposit('1000000000000000000', {from: accounts[6]});


      await TestUSDTInstance.transfer(Pool1Instance.address, '1000000000000000000000');
      await PoolControllerInstance.addRevenue(0, TestUSDTInstance.address, '1000000000000000000000');


      let balanceUSDTBefore = await TestUSDTInstance.balanceOf(accounts[5])
      await Pool1Instance.withdraw('0', {from: accounts[5]});
      let balanceUSDTAfter = await TestUSDTInstance.balanceOf(accounts[5])

      // console.log("balanceUSDTBefore: ", balanceUSDTBefore.toString())
      // console.log("balanceUSDTAfter: ", balanceUSDTAfter.toString())

      let balanceUSDT2Before = await TestUSDTInstance.balanceOf(accounts[6])
      await Pool1Instance.withdraw('0', {from: accounts[6]});
      let balanceUSDT2After = await TestUSDTInstance.balanceOf(accounts[6])

      // console.log("balanceUSDT2Before: ", balanceUSDT2Before.toString())
      // console.log("balanceUSDT2After: ", balanceUSDT2After.toString())

      assert.ok(balanceUSDT2After.toString()/2 == balanceUSDTAfter.toString()/1)

    } catch(e) {
      assert.fail(e)
    }
  })

  it('multiply revenue part', async() => {
    try {
      await TestUSDCInstance.transfer(Pool1Instance.address, '1000000000000000000000');
      await PoolControllerInstance.addRevenue(0, TestUSDCInstance.address, '1000000000000000000000');

      await TestDAIInstance.transfer(Pool1Instance.address, '1000000000000000000000');
      await PoolControllerInstance.addRevenue(0, TestDAIInstance.address, '1000000000000000000000');


      let balanceUSDTBefore = await TestUSDTInstance.balanceOf(accounts[5])
      await Pool1Instance.withdraw('0', {from: accounts[5]});
      let balanceUSDTAfter = await TestUSDTInstance.balanceOf(accounts[5])

      // console.log("balanceUSDTBefore: ", balanceUSDTBefore.toString())
      // console.log("balanceUSDTAfter: ", balanceUSDTAfter.toString())

      let balanceUSDT2Before = await TestUSDTInstance.balanceOf(accounts[6])
      await Pool1Instance.withdraw('0', {from: accounts[6]});
      let balanceUSDT2After = await TestUSDTInstance.balanceOf(accounts[6])

      // console.log("balanceUSDT2Before: ", balanceUSDT2Before.toString())
      // console.log("balanceUSDT2After: ", balanceUSDT2After.toString())

      assert.ok(balanceUSDT2After.toString()/2 == balanceUSDTAfter.toString()/1)

      //-----------------------------------------------
      
      let balanceUSDCBefore = await TestUSDCInstance.balanceOf(accounts[5])
      await Pool1Instance.withdraw('0', {from: accounts[5]});
      let balanceUSDCAfter = await TestUSDCInstance.balanceOf(accounts[5])

      // console.log("balanceUSDCBefore: ", balanceUSDCBefore.toString())
      // console.log("balanceUSDCAfter: ", balanceUSDCAfter.toString())

      let balanceUSDC2Before = await TestUSDCInstance.balanceOf(accounts[6])
      await Pool1Instance.withdraw('0', {from: accounts[6]});
      let balanceUSDC2After = await TestUSDCInstance.balanceOf(accounts[6])

      // console.log("balanceUSDC2Before: ", balanceUSDC2Before.toString())
      // console.log("balanceUSDC2After: ", balanceUSDC2After.toString())

      assert.ok(balanceUSDT2After.toString()/2 == balanceUSDTAfter.toString()/1)
      //--------------------------------------------


      await TestLPInstance1.transfer(accounts[4], '10000000000000000000');
      await TestLPInstance1.approve(Pool1Instance.address, '10000000000000000000', {from: accounts[4]});
      await Pool1Instance.deposit('1000000000000000000', {from: accounts[4]});

      let balanceUSDT3After = await TestUSDCInstance.balanceOf(accounts[4])
      let balanceUSDC3After = await TestUSDCInstance.balanceOf(accounts[4])
      let balanceDAI3After = await TestUSDCInstance.balanceOf(accounts[4])
      assert.equal(balanceUSDT3After.toNumber(), 0);
      assert.equal(balanceUSDC3After.toNumber(), 0);
      assert.equal(balanceDAI3After.toNumber(), 0);


      let balanceDAIBefore = await TestDAIInstance.balanceOf(accounts[5])
      await Pool1Instance.withdraw('0', {from: accounts[5]});
      let balanceDAIAfter = await TestDAIInstance.balanceOf(accounts[5])

      await Pool1Instance.withdraw('0', {from: accounts[5]});

      let balanceDAIAfterAfter = await TestDAIInstance.balanceOf(accounts[5])
      assert.equal(balanceDAIAfter.toString(), balanceDAIAfterAfter.toString());

      // console.log("balanceDAIBefore: ", balanceDAIBefore.toString())
      // console.log("balanceDAIAfter: ", balanceDAIAfter.toString())

      let balanceDAI2Before = await TestUSDTInstance.balanceOf(accounts[6])
      await Pool1Instance.withdraw('0', {from: accounts[6]});
      let balanceDAI2After = await TestUSDTInstance.balanceOf(accounts[6])

      // console.log("balanceDAI2Before: ", balanceDAI2Before.toString())
      // console.log("balanceDAI2After: ", balanceDAI2After.toString())
      assert.ok(balanceUSDT2After.toString()/2 == balanceUSDTAfter.toString()/1)

      //------------------------------------------

    } catch(e) {
      assert.fail(e)
    }
  })
 
});





























