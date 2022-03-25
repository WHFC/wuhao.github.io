// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
// const depolyedAitTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
// const depolyedWHTTokenAddr = require(`../deployments/${network.name}/WHToken.json`)
// const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
// const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`)
const { abi:FlashSwapAbi, bytecode:FlashSwapByteCode } = require('../artifacts/contracts/FlashSwap/FlashSwap.sol/FlashSwap.json');
const { abi:v2routerAbi, bytecode:v2routerByteCode } = require('../artifacts/flattened/uniswap-v2-periphery-master/UniswapV2Router02.sol/UniswapV2Router02.json');

async function main() {
  let [owner]  = await ethers.getSigners();
  const AT = "0xeA80ED9Bb4Cf9fc377E4346FB8588f6b5D8f3A98";
  const WHT = "0x3a81278B6C87869624ff0A1b435f59A8A4cFB713";
  const v3router = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45";
  const v2router = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

  const UniswapV2Router02 = await new ethers.ContractFactory(v2routerAbi, v2routerByteCode, owner);
  const v2routerContract = await UniswapV2Router02.attach(v2router);

  const factory = await v2routerContract.factory();
  console.log("factory: ", factory);

  const FlashSwap = await new ethers.ContractFactory(FlashSwapAbi, FlashSwapByteCode, owner);
  const flashswap = await FlashSwap.deploy(factory, v3router, AT, WHT);
  await flashswap.deployed();
  console.log("FlashSwap deployed to:", flashswap.address);
  await writeAddr(flashswap.address, "FlashSwap", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
