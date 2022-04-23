// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi, bytecode } = require('../artifacts/contracts/Safemoon/Safemoon.sol/SafeMoon.json');
const { abi:routerAbi, bytecode:routerByteCode } = require('../artifacts/flattened/uniswap-v2-periphery-master/UniswapV2Router02.sol/IUniswapV2Router01.json');
const depolyedRouterAddr = require(`../deployments/${network.name}/UniswapV2Router02.json`)

const overrides = {
  value:ethers.utils.parseEther("100")
}

async function transerToOther(addressSafemoon, pair) {
  let [, owner2, owner3]  = await ethers.getSigners();
  const Safemoon = await new ethers.ContractFactory(abi, bytecode, owner2);
  const safemoon = await Safemoon.attach(addressSafemoon);
  console.log("balance of pair: ", await safemoon.balanceOf(pair));
  let tx = await safemoon.transfer(owner3.address, ethers.utils.parseUnits("5000", 18));
  await tx.wait();
  console.log("balance of pair: ", await safemoon.balanceOf(pair));
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  let [owner, owner2]  = await ethers.getSigners();
  const Safemoon = await new ethers.ContractFactory(abi, bytecode, owner);
  const safemoon = await Safemoon.deploy();
  await safemoon.deployed();
  console.log("Safemoon deployed to:", safemoon.address);
  await writeAddr(safemoon.address, "Safemoon", network.name);

  let pairAddr = await safemoon.uniswapV2Pair();
  console.log("pair addr: ", pairAddr);

  const Router = await new ethers.ContractFactory(routerAbi, routerByteCode, owner);
  console.log("ContractFactory to router");
  router = await Router.attach(depolyedRouterAddr.address);
  console.log("attach to router");

  console.log("begin approve to router");
  let tx = await safemoon.approve(depolyedRouterAddr.address, ethers.utils.parseUnits("100", 18));
  await tx.wait();
  console.log("approve to router");

  tx = await router.addLiquidityETH(safemoon.address, ethers.utils.parseUnits("100", 18), 0, 0, owner.address, 9999999999, overrides);
  await tx.wait();
  console.log("addLiquidity");

  tx = await safemoon.transfer(owner2.address, ethers.utils.parseUnits("10000", 18));
  await tx.wait();
  await transerToOther(safemoon.address, pairAddr);
  tx = await safemoon.excludeFromReward(owner2.address);
  await tx.wait();
  console.log("exclude owner2");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
