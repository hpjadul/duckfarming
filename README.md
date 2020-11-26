# DuckFarming

# Basic Instructions

Your main contract is PoolController. It contains links to all pools. 

At first you need to connect to PoolController via Remix or etherscan. I'll using remix as exapmle (it's harder).

1. Clone current repository and run ```npm install```
2. Install remixd: ```npm install -g remixd```
3. Run: ```remixd -s <shared folder> --remix-ide https://remix.ethereum.org``` .For example ```remixd -s C:\Users\romuch\DuckFarming_Contracts --remix-ide https://remix.ethereum.org```
4. Navigate to: https://remix.ethereum.org/
5. Move to Plugin Manager (on the left) and find remixd there. Press activate.
6. Move to File Explorers (on the left). You'll see the localhost folder. Find contract PoolController there.
7. Move to next tab (Solidity Compiler). Press compile PoolController.sol.
8. Move to next tab (Deploy & Run Transactions). On this step check your metamask plugin, network and account must be correct.
9. Find label `CONTRACT` near orange button `Deploy`. Chose there PoolController.
10. Copy POOL_CONTROLLER address from config and paste it in the input field near `At Address` button. Press `At Address`

Finally we connected to Pool contoller.

To connect to pool change PoolController to Pool on current list

# Create new pool

1. Find function `newPool` in the `PoolController` contract.
2. Open input fields (on the right).
3. Put in data:
	- lpToken: liquidity pool address, which tokens pool accept.
	- startingBlock: block, from which reward will be produced.
	- blocks: it's a part of stages (array).
	- farmingSupplies: how much tokens will be minted for each stage.

	Example for testPool1:
	```
		lpToken: 0x2482B193c64d54107de93e88559100B0EB18dC65
		startingBlock: 7605487
		blocks: [46368,"558072","46368","558072","46368","1162512",9671040]
		farmingSupplies: ["3000000000000000000000000","2000000000000000000000000","3000000000000000000000000","2000000000000000000000000","3000000000000000000000000","2000000000000000000000000","5000000000000000000000000"]
	```

4. Press the button `transact` and wait for transaction confirmation.
5. Pool address you can find or in etherscan transaction or calling `pools` with index. Last pool will take last index

# Add revenue to pool

1. Send any tokens to some pool contract.
2. Find `addRevenue` in the `PoolController` contract.
3. Put in data:
	- poolIndex: index of pool which take revenue
	- tokenAddress: address of token which you sent on the 1st step.
	- amount: amount of token which you sent on the 1st step.

	Example for 1000USDC:
	```
		poolIndex: 0,
		tokenAddress: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
		amount: 1000000000
	```
	Be carefull with decimals. USDC has 6 decimals, so 1000USDC is 1000 000000.


4. Press the button `transact` and wait for transaction confirmation.


# TEST CONTRACTS

```
DUCK_TOKEN: 0xE3AC02Fd4E4E90129B15e7000C02e465504eA44f
POOL_CONTROLLER: 0x6DAa37c4cf792D7966b7A3895687d3d32E5007aF
TEST_TOKEN: 0x8791BDdb29662441a39c5f2fA28a282ae3f83C1b
TEST_POOL1: 0xf297e719d4dE22692087C0FdF1EA962BA6c9994c
TEST_POOL2: 0x2482B193c64d54107de93e88559100B0EB18dC65
POOL0: 0x9108AF19e626e211a3AD734492834A7E3087F515
POOL1: 0x6Ba5FCfA25f1288b47C434A9FF4AA8d0b6a0f39B
```