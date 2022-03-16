// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi:routerAbi, bytecode:routerBytecode } = require('../artifacts/flattened/uniswap-v2-periphery-master/UniswapV2Router02.sol/UniswapV2Router02.json');
const { abi:wethAbi, bytecode:wethBytecode } = require('../artifacts/contracts/uniswap-v2-periphery-master/contracts/test/WETH9.sol/WETH9.json');
const factoryAddr = require(`../deployments/${network.name}/UniswapV2Factory.json`)

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let [owner]  = await ethers.getSigners();
  const WETH9 = await new ethers.ContractFactory(wethAbi, wethBytecode, owner);
  const weth = await WETH9.deploy();
  await weth.deployed();
  console.log("WETH9 deployed to:", weth.address);
  await writeAddr(weth.address, "WETH9", network.name);

  const UniswapV2Router02 = await new ethers.ContractFactory(routerAbi, routerBytecode, owner);
  const router = await UniswapV2Router02.deploy(factoryAddr.address, weth.address);
  await router.deployed();
  console.log("UniswapV2Router02 deployed to:", router.address);
  await writeAddr(router.address, "UniswapV2Router02", network.name);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
