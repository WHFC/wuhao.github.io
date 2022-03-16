// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let [owner]  = await ethers.getSigners();
  const AirToken = await new ethers.ContractFactory(abi, bytecode, owner);
  const token = await AirToken.deploy("AirToken", "AT");
  await token.deployed();
  console.log("token deployed to:", token.address);
  const token2 = await AirToken.deploy("WHToken", "WHT");
  await token2.deployed();
  console.log("token2 deployed to:", token2.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
