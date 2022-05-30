// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const Web3 = require('web3');
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
// const depolyedMaterChefAddr = require(`../deployments/${network.name}/MasterChef.json`)
// const { abi:masterchefAbi, bytecode:smasterchefBytecode } = require('../artifacts/contracts/sushiswap/contracts/MasterChef.sol/MasterChef.json');

async function main() {
  let [owner]  = await ethers.getSigners();
  const AirToken = await new ethers.ContractFactory(abi, bytecode, owner);
  var web3 = await new Web3(Web3.givenProvider || providerUrl[network.name]);
  let gas = await web3.eth.estimateGas({data:AirToken.getDeployTransaction().data});
  console.log("estimate depoly gas: ", gas);
  const token = await AirToken.deploy("AirToken", "AT");
  await token.deployed();
  console.log("AirToken deployed to:", token.address);
  await writeAddr(token.address, "AirToken", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
