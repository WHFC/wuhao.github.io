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
    const {marketReceiver} = await getNamedAccounts();
    const { signer1, signer2, signer3 } = await getNamedAccounts()

    let token = await ethers.getContract('KIKIToken');
    let vault = await ethers.getContract('KIKIVault');

    await deploy('MarketMultiSignature', {
        from: deployer.address,
        args: [token.address, marketReceiver, [signer1, signer2, signer3], 2],
        log: true,
        contract: 'MultiSignature',
    });
    let marketMultiSignature = await ethers.getContract('MarketMultiSignature');

    let deployResult = await deploy('MarketLocker', {
        from: deployer.address,
        args: [token.address, vault.address, marketMultiSignature.address],
        log: true,
    });
    let marketLocker = await ethers.getContract('MarketLocker');

    let maxSupply = await token.MAX_SUPPLY();
    maxSupply = new BigNumber(maxSupply.toString());
    let releaseAmount = maxSupply.multipliedBy('9').dividedBy('100').toFixed(0); //9%
    let isMinter = new BigNumber(((await token.minters(marketLocker.address)).toString())).comparedTo('0') > 0;
    if (!isMinter) {
        //tx = await token.connect(deployer).addMinter(marketLocker.address, releaseAmount);
        //tx = await tx.wait();
        console.log("add minter: " + marketLocker.address + " , maxMint: " + releaseAmount);
    }
};

module.exports.tags = ['MarketLocker'];
module.exports.dependencies = ['KIKIToken', 'KIKIVault'];
