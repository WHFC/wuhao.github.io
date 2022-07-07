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
    const {activeVaultCaller, marketReceiver} = await getNamedAccounts();

    let token = await ethers.getContract('KIKIToken');

    let deployResult = await deploy('ActiveVault', {
        from: deployer.address,
        args: [token.address, activeVaultCaller, marketReceiver],
        log: true,
    });
    let vault = await ethers.getContract('ActiveVault');

};

module.exports.tags = ['ActiveVault'];
//module.exports.dependencies = ['KIKIToken'];
