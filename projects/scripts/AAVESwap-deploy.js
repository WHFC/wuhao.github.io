// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi:AAVESwapAbi, bytecode:AAVESwapteCode } = require('../artifacts/flattened/AAVESwap/AAVESwap.sol/AAVESwap.json');

const overrides = {
  gasLimit: 3000000,
  gasPrice: 0
}

async function main() {
  let [owner]  = await ethers.getSigners();

  const AAVESwap = await new ethers.ContractFactory(AAVESwapAbi, AAVESwapteCode, owner);
  const aaveswap = await AAVESwap.deploy();
  await aaveswap.deployed();
  console.log("AAVESwap deployed to:", aaveswap.address);
  await writeAddr(aaveswap.address, "AAVESwap", network.name);
  let tx = await aaveswap.flashloan(ethers.utils.parseUnits('100', 18), overrides);
  await tx.wait();
  console.log("aave flashloan finished");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
