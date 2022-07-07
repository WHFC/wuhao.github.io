const BigNumber = require('bignumber.js');
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR })
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    let {WETH} = await getNamedAccounts();

    await deploy('MockFactory', {
        from: deployer.address,
        args: [deployer.address],
        log: true,
    });
    let factory = await ethers.getContract('MockFactory');

    if (hre.network.tags.local || hre.network.tags.test) {
        WETH = await ethers.getContract("MockToken_WETH");
        WETH = WETH.address;
    }
    await deploy('MockRouter', {
        from: deployer.address,
        args: [factory.address, WETH],
        log: true,
    });
    let router = await ethers.getContract('MockRouter');

};

module.exports.tags = ['MockSwap'];
if (hre.network.tags.local) {
    module.exports.dependencies = ["MockToken"];
} else {
    module.exports.dependencies = [];
}
