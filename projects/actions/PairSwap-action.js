const { ethers } = require("hardhat");

const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
const { pairAddr } = require('./InterestArbitrage/config/InterestArbitrageConfig.json');
const { abi:pairAbi, bytecode:pairByteCode } = require('../artifacts/flattened/uniswap-v2-core-master/UniswapV2Factory.sol/UniswapV2Pair.json');

const overrides = {
  gasLimit: 3000000,
  gasPrice: 0
}

async function main() {
  // let balance = ethers.utils.parseUnits("1", 18);
  // console.log(ethers.utils.defaultAbiCoder.encode(['uint256'], [balance]));
  // return;
  let [owner]  = await ethers.getSigners();
  const UniswapV2Pair = await new ethers.ContractFactory(pairAbi, pairByteCode, owner);
  pair = await UniswapV2Pair.attach(pairAddr);
  let tx = await pair.sync();
  await tx.wait();
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

