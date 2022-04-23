// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi:ERC20AssemblyAbi, bytecode:ERC20AssemblyByteCode } = require('../artifacts/contracts/ERC20Assembly/ERC20Assembly.sol/ERC20Assembly.json');

const overrides = {
  gasLimit: 3000000,
  gasPrice: 0
}

async function main() {
  let [owner]  = await ethers.getSigners();

  const ERC20Assembly = await new ethers.ContractFactory(ERC20AssemblyAbi, ERC20AssemblyByteCode, owner);
  const token = await ERC20Assembly.deploy("123", "123");
  await token.deployed();
  console.log("ERC20Assembly deployed to:", token.address);
  let tx = await token.mint(owner.address, 1);
  await tx.wait();
  console.log("value: ", await token.balanceOf(owner.address));
  tx = await token.burn(owner.address, 1);
  await tx.wait();
  console.log("value: ", await token.balanceOf(owner.address));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
