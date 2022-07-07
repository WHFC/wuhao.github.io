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
    const {teamReceiver, daoReceiver} = await getNamedAccounts();
    const { signer1, signer2, signer3 } = await getNamedAccounts()

    let token = await ethers.getContract('KIKIToken');
    let vault = await ethers.getContract('KIKIVault');

    await deploy('TeamMultiSignature', {
        from: deployer.address,
        args: [token.address, teamReceiver, [signer1, signer2, signer3], 2],
        log: true,
        contract: 'MultiSignature',
    });
    let teamMultiSignature = await ethers.getContract('TeamMultiSignature');

    await deploy('DaoMultiSignature', {
        from: deployer.address,
        args: [token.address, daoReceiver, [signer1, signer2, signer3], 2],
        log: true,
        contract: 'MultiSignature',
    });
    let daoMultiSignature = await ethers.getContract('DaoMultiSignature');

    let deployResult = await deploy('TeamLocker', {
        from: deployer.address,
        args: [token.address, vault.address, teamMultiSignature.address, daoMultiSignature.address],
        log: true,
    });
    let teamLocker = await ethers.getContract('TeamLocker');

    let maxSupply = await token.MAX_SUPPLY();
    maxSupply = new BigNumber(maxSupply.toString());
    let releaseAmount = maxSupply.multipliedBy('20').dividedBy('100').toFixed(0); //20%
    let isMinter = new BigNumber(((await token.minters(teamLocker.address)).toString())).comparedTo('0') > 0;
    if (!isMinter) {
        //tx = await token.connect(deployer).addMinter(teamLocker.address, releaseAmount);
        //tx = await tx.wait();
        console.log("add minter: " + teamLocker.address + " , maxMint: " + releaseAmount);
    }
};

module.exports.tags = ['TeamLocker'];
module.exports.dependencies = ['KIKIToken', 'KIKIVault'];
