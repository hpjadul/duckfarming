const { catchRevert, catchRevertMessage} = require("./exceptions.js");

const DuckToken = artifacts.require("DuckToken");
const PoolController = artifacts.require("PoolController");
const Pool = artifacts.require("Pool");
const TestToken = artifacts.require("TestToken")

const ADDRESS0 = '0x0000000000000000000000000000000000000000';


const Pool1 = {
  startingBlock: 500,
  stage0: {
    blocks: 46368,
    farmingSupply: 3000000
  },
  stage1: {
    blocks: 558072,
    farmingSupply: 2000000
  },
  stage2: {
    blocks: 46368,
    farmingSupply: 3000000
  },
  stage3: {
    blocks: 558072,
    farmingSupply: 2000000
  },
  stage4: {
    blocks: 46368,
    farmingSupply: 3000000
  },
  stage5: {
    blocks: 1162512,
    farmingSupply: 2000000
  },
  stage6: {
    blocks: 9671040,
    farmingSupply: 5000000
  }
}


contract("Pool tests", accounts => {

  let presaleWallet = accounts[7];
  let teamWallet = accounts[8];
  let devAddress = accounts[9];
  
  it("catch instances", async () => {
    DuckTokenInstance = await DuckToken.deployed();
    PoolControllerInstance = await PoolController.deployed();
    TestTokenInstance1 = await TestToken.new('TestLPToken1','TestLPToken1', '1000000000000000000000');
    // await DuckTokenInstance.transferOwnership(PoolControllerInstance.address);
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

    } catch (e) {
      assert.fail(e);
    }
  })

  it('create first pool', async () => {
    try {
      let currentBlock = web3.eth.getBlockNumber();

      let result = await PoolControllerInstance.newPool(TestTokenInstance1.address, Pool1.startingBlock,
        [Pool1.stage0.blocks, Pool1.stage1.blocks, Pool1.stage2.blocks, Pool1.stage3.blocks, Pool1.stage4.blocks, Pool1.stage5.blocks, Pool1.stage6.blocks],
        [Pool1.stage0.farmingSupply], Pool1.stage1.farmingSupply, Pool1.stage2.farmingSupply, Pool1.stage3.farmingSupply,  Pool1.stage4.farmingSupply,  Pool1.stage5.farmingSupply,  Pool1.stage6.farmingSupply)

      Pool1Instance = await Pool.at(result.logs[0].args[0]);
      // await Pool1Instance.updatePool();
      let period0 = await Pool1Instance.periods(0);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);

      let period1 = await Pool1Instance.periods(1);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);

      let period2 = await Pool1Instance.periods(2);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);

      let period3 = await Pool1Instance.periods(3);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);

      let period4 = await Pool1Instance.periods(4);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);

      let period5 = await Pool1Instance.periods(5);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);

      let period6 = await Pool1Instance.periods(6);
      assert.equal(Number(period0[0]), Pool1.startingBlock);
      assert.equal(Number(period0[1]), Pool1.stage1.blocks);
      assert.equal(Number(period0[2]), Pool1.stage1.farmingSupply);
    } catch (e) {
      assert.fail(e);
    }
  })






});