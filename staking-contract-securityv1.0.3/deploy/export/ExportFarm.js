fs = require('fs');
const { promisify } = require('util');
const BigNumber = require('bignumber.js');
const { TOKENS } = require('../../config/defaultlist.token.js');
const { formatSymbol } = require('../../util/common.js');
const { CONFIG } = require('../../config/config.js');
module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
    let tokenImages = {};
    let imagePrefix = CONFIG.imageRootURL;
    for (let i = 0; i < TOKENS.length; i ++) {
        tokenImages[TOKENS[i].symbol] = TOKENS[i].image;
    }
    tokenImages['KIKI'] = imagePrefix + CONFIG.tokenName + '.' + CONFIG.imageSuffix;
    const {deploy} = deployments;
    const {deployer} = await ethers.getNamedSigners();

    let masterChef = await ethers.getContract('MasterChef');
    let allPools = []
    //console.log("begin get all pools");
    let poolLength = (await masterChef.poolLength()).toNumber();
    let pools = []
    for (let i = 0; i < poolLength; i ++) {
        console.log("(" + (i + 1) + "/" + poolLength + ")");
        let poolInfo = await masterChef.poolInfo(i + "");
        let lp = poolInfo.lpToken;
        let pair = await ethers.getContractAt('MockPair', lp);
        let token0 = await pair.token0();
        token0 = await ethers.getContractAt('ERC20', token0);
        let token1 = await pair.token1();
        token1 = await ethers.getContractAt('ERC20', token1);
        let symbol0 = await token0.symbol();
        let symbol1 = await token1.symbol();
        if (symbol0 == "USDT") {
            [token0, token1] = [token1, token0];
        } else if (symbol1 == "USDT") {

        } else if (symbol0 == "WBNB") {
            [token0, token1] = [token1, token0];
        } else if (symbol1 == "WBNG") {

        } else if (symbol0 == "WETH") {
            [token0, token1] = [token1, token0];
        } else if (symbol1 == "WETH") {

        } else if (symbol0 == "WHT") {
            [token0, token1] = [token1, token0];
        } else if (symbol1 == "WHT") {
        }
        pools.push({
            pid: i,
            pair: {
                name: await pair.name(),
                symbol: await pair.symbol(),
                decimals: await pair.decimals(),
                address: pair.address,
                image: "",
            },
            token0: {
                name: await token0.name(),
                symbol: await token0.symbol(),
                decimals: await token0.decimals(),
                address: token0.address,
                image: tokenImages[await token0.symbol()].image,
            },
            token1: {
                name: await token1.name(),
                symbol: await token1.symbol(),
                decimals: await token1.decimals(),
                address: token1.address,
                image: tokenImages[await token1.symbol()].image,
            },
            allocPoint: poolInfo.allocPoint.toNumber(),
        });
    }
    let poolsStr = JSON.stringify(pools, null, 4);
    console.log(poolsStr);
    if (hre.network.tags.local) {
        return;
    }
    let fileName = './config/farm.' + (await getChainId()) + ".js";
    console.log(fileName);
    const writeFileAsync = promisify(fs.writeFile)
    await writeFileAsync(fileName, "module.exports.POOLS = " + poolsStr);
};

module.exports.tags = ['ExportFarm'];
if (hre.network.tags.local) {
    module.exports.dependencies = ['MasterChefDefaultList'];
}
