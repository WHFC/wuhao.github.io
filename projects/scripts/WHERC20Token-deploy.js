// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/flattened/WHERC20Token.sol/WHERC20Token.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  console.log("1");
  let [owner]  = await ethers.getSigners();
  console.log("2");
  const WHERC20Token = await new ethers.ContractFactory(abi, bytecode, owner);
  const token = await WHERC20Token.deploy();
  console.log("3");

  await token.deployed();
  console.log("4");
  console.log("WHERC20Token deployed to:", token.address);
  await writeAddr(token.address, "WHERC20Token", network.name);

  // const vault = await ethers.getContractFactory("vault");
  // const vaulttoken = await vault.deploy(token.address);
  // console.log("vault deployed to:", vaulttoken.address);
  // await writeAddr(vaulttoken.address, "vault", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
