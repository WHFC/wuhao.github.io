module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    let deployResult = await deploy('KIKIToken', {
        from: deployer.address,
        args: [],
        log: true,
    });
};

module.exports.tags = ['KIKIToken'];
module.exports.dependencies = [];
