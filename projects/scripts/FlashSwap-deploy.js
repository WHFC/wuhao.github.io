// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const depolyedAitTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
const depolyedWHTTokenAddr = require(`../deployments/${network.name}/WHToken.json`)
const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`)
const { abi:FlashSwapAbi, bytecode:FlashSwapByteCode } = require('../artifacts/contracts/FlashSwap/FlashSwap.sol/FlashSwap.json');

async function main() {
  let [owner]  = await ethers.getSigners();

  const FlashSwap = await new ethers.ContractFactory(FlashSwapAbi, FlashSwapByteCode, owner);
  const flashswap = await FlashSwap.deploy(factoryAddr.address, owner.address, depolyedAitTokenAddr.address, depolyedWHTTokenAddr.address);
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
