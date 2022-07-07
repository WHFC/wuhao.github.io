const BigNumber = require('bignumber.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    const {vaultCaller} = await getNamedAccounts();

    let token = await ethers.getContract('KIKIToken');

    let deployResult = await deploy('KIKIVault', {
        from: deployer.address,
        args: [token.address, vaultCaller],
        log: true,
    });
    let vault = await ethers.getContract('KIKIVault');

    let maxSupply = await token.MAX_SUPPLY();
    maxSupply = new BigNumber(maxSupply.toString());
    let releaseAmount = maxSupply.multipliedBy('60').dividedBy('100').toFixed(0); //60%
    let isMinter = new BigNumber(((await token.minters(vault.address)).toString())).comparedTo('0') > 0;
    if (!isMinter) {
        //tx = await token.connect(deployer).addMinter(vault.address, releaseAmount);
        //tx = await tx.wait();
        console.log("add minter: " + vault.address + " , maxMint: " + releaseAmount);
    }
};

module.exports.tags = ['KIKIVault'];
module.exports.dependencies = ['KIKIToken'];
