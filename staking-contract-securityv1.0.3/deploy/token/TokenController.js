module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    const { signer1, signer2, signer3 } = await getNamedAccounts()
    
    let token = await ethers.getContract('KIKIToken');

    await deploy('TokenControllerMultiSignature', {
        from: deployer.address,
        args: [token.address, [signer1, signer2, signer3], 2],
        log: true,
    });
    let tokenControllerMultiSignature = await ethers.getContract('TokenControllerMultiSignature');

    let minDelay = 24 * 60 * 60; //24 hours
    if (hre.network.tags.local || hre.network.tags.test) {
        minDelay = 60; //1 minutes
    }
    let deployResult = await deploy('TimeLocker', {
        from: deployer.address,
        args: [minDelay, [tokenControllerMultiSignature.address], [tokenControllerMultiSignature.address]],
        log: true,
    });
    let timeLocker = await ethers.getContract('TimeLocker');

    let currentTimeLocker = await tokenControllerMultiSignature.timeLocker();
    if (currentTimeLocker != timeLocker.address) {
        tx = await tokenControllerMultiSignature.connect(deployer).setTimeLocker(timeLocker.address);
        tx = await tx.wait();
        console.dir("init timeLocker as : " + timeLocker.address);
    }

    let currentOwner = await token.owner();
    if (currentOwner != timeLocker.address) {
        /*
        tx = await token.connect(deployer).setPendingOwner(timeLocker.address);
        tx = await tx.wait();
        */
        tx = await timeLocker.connect(deployer).acceptOwner(token.address); 
        tx = await tx.wait();
        console.log("change token ownership to timeLocker: " + timeLocker.address);
    }
    
};

module.exports.tags = ['TokenController'];
module.exports.dependencies = ['KIKIToken'];
