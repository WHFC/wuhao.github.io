const ethers = require('ethers');

async function main() {
    var _reserve0 = ethers.BigNumber.from('0x4089d1b3348aba1b9e2');
    var _reserve1 = ethers.BigNumber.from('0x35e0e6127dd7feb8a4');
    var balanceOfPairInSERA = ethers.BigNumber.from('0xacc624a0323533eb8a4');
    var swapAmountOutUSD = ethers.BigNumber.from('0x3f47037bfdd87eb1832');
    
    var amountInWithFee = balanceOfPairInSERA.sub(_reserve1).mul(997);
    var numerator = amountInWithFee.mul(_reserve0);
    var denominator = _reserve1.mul(1000).add(amountInWithFee);
    amountOut = numerator.div(denominator);
    console.log("_reserve0(USD): ", ethers.utils.formatUnits(_reserve0, 18));
    console.log("_reserve1(SERA): ", ethers.utils.formatUnits(_reserve1, 18));
    console.log("balanceOfPairInSERA: ", ethers.utils.formatUnits(balanceOfPairInSERA, 18));
    console.log("calc amountIn: ", ethers.utils.formatUnits(balanceOfPairInSERA.sub(_reserve1), 18));
    console.log("UniswapV2Library getAmountOut return: ", ethers.utils.formatUnits(amountOut, 18));
    console.log("swapAmountOutUSD: ", ethers.utils.formatUnits(swapAmountOutUSD, 18));
    console.log("before swap k: ", ethers.utils.formatUnits(_reserve0.mul(_reserve1), 36));
    console.log("after swap k: ", ethers.utils.formatUnits(balanceOfPairInSERA.mul(_reserve0.sub(swapAmountOutUSD)), 36));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});