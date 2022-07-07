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

    let factory = await ethers.getContract('MockFactory');
    let router = await ethers.getContract('MockRouter');
    let token = await ethers.getContract('KIKIToken');
    for (let i = 0; i < PAIRS.length; i ++) {
        let pair = PAIRS[i];
	    //console.log(pair);
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
        //console.log(lp);
        if (lp == '0x0000000000000000000000000000000000000000') {
            tx = await factory.createPair(token0.address, token1.address);
            tx = await tx.wait();
            lp = await factory.getPair(token0.address, token1.address);
            console.log ("create lp for " + symbol0 + "-" + symbol1 + " result " + lp);
        }
        let lpToken = await ethers.getContractAt('IMockPair', lp);
        if ((await lpToken.totalSupply()).toString() == '0') {
            let decimals0 = await token0.decimals();
            let amount0 = new BigNumber('0.01').multipliedBy(new BigNumber('10').exponentiatedBy(decimals0)).toFixed(0);
            let decimals1 = await token1.decimals();
            let amount1 = new BigNumber('0.01').multipliedBy(new BigNumber('10').exponentiatedBy(decimals1)).toFixed(0);
            if (symbol0 == 'WBNB' || symbol0 == 'WETH' || symbol0 == 'WHT') {
                token0 = await ethers.getContractAt('WETH', token0.address);
                tx = await token0.connect(deployer).deposit({value: amount0});
                tx = await tx.wait();
            } else {
                token0 = await ethers.getContractAt('MockToken', token0.address);
                tx = await token0.connect(deployer).mint(deployer.address, amount0);
                tx = await tx.wait();
            }
            if (symbol1 == 'WBNB' || symbol1 == 'WETH' || symbol1 == 'WHT') {
                token1 = await ethers.getContractAt('WETH', token1.address);
                tx = await token1.connect(deployer).deposit({value: amount1});
                tx = await tx.wait();
            } else {
                token1 = await ethers.getContractAt('MockToken', token1.address);
                tx = await token1.connect(deployer).mint(deployer.address, amount1);
                tx = await tx.wait();
            }
            tx = await token0.connect(deployer).approve(router.address, amount0);
            tx = await tx.wait();
            tx = await token1.connect(deployer).approve(router.address, amount1);
            tx = await tx.wait();
            tx = await router.connect(deployer).addLiquidity(
                token0.address,
                token1.address,
                amount0,
                amount1,
                0,
                0,
                deployer.address,
                Math.ceil(new Date().getTime() / 1000 + 100000000),
            );
            tx = await tx.wait();
            console.log("add liquidity for " + symbol0 + "-" + symbol1);
        }
    }
};

module.exports.tags = ['MockPair'];
if (hre.network.tags.local) {
    module.exports.dependencies = ['MockToken', 'KIKIToken', 'MockSwap'];
}
