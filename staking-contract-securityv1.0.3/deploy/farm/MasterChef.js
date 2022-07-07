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

    let token = await ethers.getContract('KIKIToken');

    let maxSupply = new BigNumber((await token.MAX_SUPPLY()).toString());
    let totalReleaseAmount = maxSupply.multipliedBy('60').dividedBy('100').toFixed(0); //60%
    //let rewardPerBlock = new BigNumber("1000000000000000000").toFixed(0);
    let rewardPerBlock = new BigNumber("0").toFixed(0);
    let startBlock = 14035085;//await ethers.provider.getBlockNumber(); 
    await deploy('MasterChef', {
        from: deployer.address,
        args: [
            token.address, 
            rewardPerBlock,
            startBlock,
        ],
        log: true,
    });
    let masterChef = await ethers.getContract('MasterChef');

    let isMinter = new BigNumber(((await token.minters(masterChef.address)).toString())).comparedTo('0') > 0;
    if (!isMinter) {
        //tx = await token.addMinter(masterChef.address, totalReleaseAmount);
        //tx = await tx.wait();
        console.log("add masterChef as minter: address: " + masterChef.address + " , maxMint: " + totalReleaseAmount);
    }
    /*
    let firstLockSeconds = '0';
    let firstLockPercent = '200000'; //20%
    let lockPeriod = 24 * 3600;
    let lockPeriodNum = 80;
    await deploy('ClaimTokenLocker', {
        from: deployer.address,
        args: [
            'Claim TokenLocker',
            'CTokenLocker',
            token.address,
            firstLockSeconds,
            firstLockPercent,
            lockPeriod,
            lockPeriodNum
        ],
        log: true,
        contract: 'TokenLocker',
    });
    let tokenLocker = await ethers.getContract('ClaimTokenLocker');
    let currentTokenLocker = await masterChef.tokenLocker();
    if (currentTokenLocker != tokenLocker.address) {
        tx = await masterChef.connect(deployer).setTokenLocker(tokenLocker.address);
        tx = await tx.wait();
        console.log("set masterChef tokenLocker as : " + tokenLocker.address);
    }
    */
};

module.exports.tags = ['MasterChef'];
if (hre.network.tags.local) {
    module.exports.dependencies = ['MockPair'];
}
