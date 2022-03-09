// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const WHERC20Token = await ethers.getContractFactory("WHERC20Token");
  const token = await WHERC20Token.deploy();

  await token.deployed();
  await writeAddr(token.address, "WHERC20Token", network.name);

  console.log("WHERC20Token deployed to:", token.address);
  const vault = await ethers.getContractFactory("vault");
  const vaulttoken = await vault.deploy(token.address);
  console.log("vault deployed to:", vaulttoken.address);
  await writeAddr(vaulttoken.address, "vault", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
