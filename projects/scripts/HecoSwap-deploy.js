// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/contracts/HecoSwap/HecoSwap.sol/HecoSwap.json');
// const depolyedMaterChefAddr = require(`../deployments/${network.name}/MasterChef.json`)
// const { abi:masterchefAbi, bytecode:smasterchefBytecode } = require('../artifacts/contracts/sushiswap/contracts/MasterChef.sol/MasterChef.json');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let [owner]  = await ethers.getSigners();
  const HecoSwap = await new ethers.ContractFactory(abi, bytecode, owner);
  const hecoSwap = await HecoSwap.deploy();
  await hecoSwap.deployed();
  console.log("HecoSwap deployed to:", hecoSwap.address);
  await writeAddr(hecoSwap.address, "HecoSwap", network.name);

  // const MasterChef = await new ethers.ContractFactory(masterchefAbi, smasterchefBytecode, owner);
  // const masterchef = await MasterChef.attach(depolyedMaterChefAddr.address);
  // let pid = await masterchef.poolLength();
  // console.log("get pool length, pid: ", pid.toNumber());  

  // let tx = await masterchef.add(100, token.address, false);
  // await tx.wait();
  // console.log("add lp token");  
  // const token2 = await AirToken.deploy("WHToken", "WHT");
  // await token2.deployed();
  // console.log("WHToken deployed to:", token2.address);
  // await writeAddr(token2.address, "WHToken", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
