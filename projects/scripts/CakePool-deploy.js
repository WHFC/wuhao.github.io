// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi:abiCToken, bytecode:bytecodeCToken } = require('../artifacts/contracts/cake-pool/contracts/MasterChef.sol/CakeToken.json');
const { abi:abiSyrupBar, bytecode:bytecodeSyrupBar } = require('../artifacts/contracts/cake-pool/contracts/MasterChef.sol/SyrupBar.json');
const { abi:abiMasterChef, bytecode:bytecodeMasterChef } = require('../artifacts/contracts/cake-pool/contracts/MasterChef.sol/MasterChef.json');

async function main() {
  let [owner]  = await ethers.getSigners();
  const CToken = await new ethers.ContractFactory(abiCToken, bytecodeCToken, owner);
  const token = await CToken.deploy();
  await token.deployed();
  console.log("CToken deployed to:", token.address);
  await writeAddr(token.address, "CToken", network.name);

  const SyrupBar = await new ethers.ContractFactory(abiSyrupBar, bytecodeSyrupBar, owner);
  const syrupBar = await SyrupBar.deploy(token.address);
  await syrupBar.deployed();
  console.log("SyrupBar deployed to:", syrupBar.address);
  await writeAddr(syrupBar.address, "SyrupBar", network.name);

  const MasterChef = await new ethers.ContractFactory(abiMasterChef, bytecodeMasterChef, owner);
  var perBlock = ethers.utils.parseUnits('100000000', 9);
  const masterChef = await MasterChef.deploy(token.address, syrupBar.address, perBlock, 0);
  await masterChef.deployed();
  console.log("MasterChef deployed to:", masterChef.address);
  await writeAddr(masterChef.address, "MasterChef", network.name);

  var amount = ethers.utils.parseUnits('10000000000', 18);
  let tx = await token.mint(amount);
  await tx.wait();

  tx = await token.transferOwnership(masterChef.address);
  await tx.wait();
  tx = await syrupBar.transferOwnership(masterChef.address);
  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
