const Ducks = artifacts.require("Ducks")
const DuckToken = artifacts.require("DuckToken");
const PoolController = artifacts.require("PoolController");

module.exports = async(deployer, network, accounts) => {
	let presaleWallet = accounts[7];
	let teamWallet = accounts[8];
	let devAddress = accounts[9];

	// let presaleWallet = '0xE594F08E0A0eEafd7FB5A736F90716dB9454b9F9';
	// let teamWallet = '0xE594F08E0A0eEafd7FB5A736F90716dB9454b9F9';
	// let devAddress = '0xE594F08E0A0eEafd7FB5A736F90716dB9454b9F9';
	await deployer.deploy(Ducks);
	await deployer.deploy(DuckToken, presaleWallet, teamWallet);
	await deployer.deploy(PoolController, DuckToken.address, devAddress, Ducks.address);

	let token = await DuckToken.at(DuckToken.address)
	await token.transferOwnership(PoolController.address);
};
