const BigNumber = require('bignumber.js');
const { PAIRS } = require('../../config/defaultlist.farm.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();
    const {UniswapFactory} = await getNamedAccounts();
    let masterChef = await ethers.getContract('MasterChef');
    let token = await ethers.getContract('KIKIToken');
    let factory = null;//await ethers.getContract('P2EFactory');
    if (hre.network.tags.local || hre.network.tags.test) {
        factory = await ethers.getContract('MockFactory');
    } else {
        factory = await ethers.getContractAt('MockFactory', UniswapFactory);
    }
    let allPools = []
    //console.log("begin get all pools");
    let poolLength = (await masterChef.poolLength()).toNumber();
    for (let i = 0; i < poolLength; i ++) {
        let poolInfo = await masterChef.poolInfo(i + "");
        allPools.push(poolInfo.lpToken);
    }
    for (let i = 0; i < PAIRS.length; i ++) {
        let pair = PAIRS[i];
        console.log("(" + (i + 1) + "/" + PAIRS.length + ")");
        let symbol = pair.symbol;
        let [symbol0, symbol1] = symbol.split("-");
        let token0 = pair.token0;
        let token1 = pair.token1;
        if (token0 == "" && symbol0 == "KIKI") {
            token0 = token.address;
        }
        if (token1 == "" && symbol1 == "KIKI") {
            token1 = token.address;
        }
        if (hre.network.tags.local || hre.network.tags.test) {
            if (symbol0 == "KIKI") {
                token0 = await ethers.getContract('KIKIToken');
            } else {
                token0 = await ethers.getContract('MockToken_' + symbol0);
            }
            if (symbol1 == "KIKI") {
                token1 = await ethers.getContract('KIKIToken');
            } else {
                token1 = await ethers.getContract('MockToken_' + symbol1);
            }
        } else {
            if (symbol0 == "KIKI") {
                token0 = await ethers.getContract('KIKIToken');
            } else {
                token0 = await ethers.getContractAt('ERC20', token0);
            }
            if (symbol1 == "KIKI") {
                token1 = await ethers.getContract('KIKIToken');
            } else {
                token1 = await ethers.getContractAt('ERC20', token1);
            }
        }
	    let lp = await factory.getPair(token0.address, token1.address);
	    //console.log(pair);
        if (lp == '0x0000000000000000000000000000000000000000') {
            if (hre.network.tags.local || hre.network.tags.test) {
                tx = await factory.createPair(token0.address, token1.address);
                tx = await tx.wait();
                lp = await factory.getPair(token0.address, token1.address);
                console.log ("create lp for " + symbol0 + "-" + symbol1 + " result " + lp);
            }
        }
	    let exists = allPools.indexOf(lp) > -1;
	    if (!exists) {
            let percent = new BigNumber(pair.percent).multipliedBy("10000").toFixed(0);
            //console.log(percent);
	        tx = await masterChef.add(percent, lp, true);
            tx = await tx.wait();
	        console.log("add farm pool " + lp + " for " + symbol0 + "-" + symbol1 + " percent: " + percent);
	    }
    }
};

module.exports.tags = ['MasterChefDefaultList'];
if (hre.network.tags.local) {
    module.exports.dependencies = ['MasterChef'];
}
