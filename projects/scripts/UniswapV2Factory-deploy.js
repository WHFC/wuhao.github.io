// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/flattened/uniswap-v2-core-master/UniswapV2Factory.sol/UniswapV2Factory.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let [owner]  = await ethers.getSigners();
  const UniswapV2Factory = await new ethers.ContractFactory(abi, bytecode, owner);
  const factory = await UniswapV2Factory.deploy(owner.address);
  await factory.deployed();
  console.log("UniswapV2Factory deployed to:", factory.address);
  await writeAddr(factory.address, "UniswapV2Factory", network.name);
  console.log("pair init code hash: ", await factory.getPairInitCode());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
