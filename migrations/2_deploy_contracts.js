const DuckToken = artifacts.require("DuckToken");
const PoolController = artifacts.require("PoolController");

module.exports = async(deployer, network, accounts) => {
	let presaleWallet = accounts[7];
	let teamWallet = accounts[8];
	let devAddress = accounts[9];

	await deployer.deploy(DuckToken, presaleWallet, teamWallet);
	await deployer.deploy(PoolController, DuckToken.address, devAddress);

	let token = await DuckToken.at(DuckToken.address)
	await token.transferOwnership(PoolController.address);
};
