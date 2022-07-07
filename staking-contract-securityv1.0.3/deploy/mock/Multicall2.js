module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {

    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    if (!hre.network.tags.local && !hre.network.tags.test) {
        return;
    }
    await deploy('Multicall2', {
        from: deployer.address,
        args: [],
        log: true,
    });
};

module.exports.tags = ['Multicall2'];
module.exports.dependencies = [];
