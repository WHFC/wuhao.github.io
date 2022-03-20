// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/contracts/sushiswap/contracts/MasterChef.sol/MasterChef.json');
const depolyedSushiAddr = require(`../deployments/${network.name}/SushiToken.json`)
const { abi:sushiAbi, bytecode:sushiBytecode } = require('../artifacts/contracts/sushiswap/contracts/SushiToken.sol/SushiToken.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let [owner, owner2]  = await ethers.getSigners();
  const SushiToken = await new ethers.ContractFactory(sushiAbi, sushiBytecode, owner);
  const sushitoken = await SushiToken.attach(depolyedSushiAddr.address);

  const MasterChef = await new ethers.ContractFactory(abi, bytecode, owner);
  const masterchef = await MasterChef.deploy(sushitoken.address, owner2.address, ethers.utils.parseUnits('50', 18), 0, ethers.utils.parseUnits('100', 18));
  await masterchef.deployed();

  console.log("MasterChef deployed to:", masterchef.address);
  await writeAddr(masterchef.address, "MasterChef", network.name);
  if (masterchef.address != await sushitoken.owner()) {
    let tx = await sushitoken.transferOwnership(masterchef.address);
    await tx.wait();
  }
  // if (owner2.address != await masterchef.owner()) {
  //   let tx = await masterchef.transferOwnership(owner2.address);
  //   await tx.wait();
  // }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
