// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { abi, bytecode } = require('../artifacts/contracts/Safemoon/Safemoon.sol/SafeMoon.json');
const depolyedSafemoonAddr = require(`../deployments/${network.name}/Safemoon.json`)

const overrides = {
  value:ethers.utils.parseEther("100")
}

async function transerToOther(addressSafemoon, pair) {
  let [, owner2, owner3]  = await ethers.getSigners();
  const Safemoon = await new ethers.ContractFactory(abi, bytecode, owner2);
  const safemoon = await Safemoon.attach(addressSafemoon);
  console.log("balance of pair: ", ethers.utils.formatUnits(await safemoon.balanceOf(pair), 9));
  let tx = await safemoon.transfer(owner3.address, ethers.utils.parseUnits("5000", 9));
  await tx.wait();
  console.log("balance of pair: ", ethers.utils.formatUnits(await safemoon.balanceOf(pair), 9));
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
  const Safemoon = await new ethers.ContractFactory(abi, bytecode, owner2);
  const safemoon = await Safemoon.attach(depolyedSafemoonAddr.address);
  let pairAddr = await safemoon.uniswapV2Pair();
  console.log("pair addr: ", pairAddr);
  await transerToOther(safemoon.address, pairAddr);
  // tx = await safemoon.excludeFromReward(owner2.address);
  // await tx.wait();
  // console.log("exclude owner2");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
