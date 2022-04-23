// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const { abi:TreasureAbi, bytecode:TreasureByteCode } = require('../artifacts/contracts/ERC20WithGov/Treasure.sol/Treasure.json');
const { abi:CompAbi, bytecode:CompByteCode } = require('../artifacts/contracts/Comp/Comp.sol/Comp.json');
const { abi:TimelockAbi, bytecode:TimelockCode } = require('../artifacts/contracts/Comp/TimelockForTreasure.sol/TimelockForTreasure.json');
const { abi:GovernorAlphaAbi, bytecode:GovernorAlphaByteCode } = require('../artifacts/contracts/Comp/GovernorAlpha.sol/GovernorAlpha.json');

const overrides = {
  gasLimit: 3000000,
  gasPrice: ethers.utils.parseUnits('9.0', 'gwei')
}

async function main() {
  let [owner]  = await ethers.getSigners();

  const Comp = await new ethers.ContractFactory(CompAbi, CompByteCode, owner);
  const comp = await Comp.deploy(owner.address);
  await comp.deployed();
  console.log("Comp deployed to:", comp.address);
  await writeAddr(comp.address, "Comp", network.name);

  let days = 60*60*24;
  const Timelock = await new ethers.ContractFactory(TimelockAbi, TimelockCode, owner);
  const timelock = await Timelock.deploy(owner.address, 2 * days);
  await timelock.deployed();
  console.log("Timelock deployed to:", timelock.address);
  await writeAddr(timelock.address, "Timelock", network.name);

  const GovernorAlpha = await new ethers.ContractFactory(GovernorAlphaAbi, GovernorAlphaByteCode, owner);
  const gov = await GovernorAlpha.deploy(timelock.address, comp.address, owner.address);
  await gov.deployed();
  console.log("GovernorAlpha deployed to:", gov.address);
  await writeAddr(gov.address, "GovernorAlpha", network.name);

  let tx = await timelock.harnessSetPendingAdmin(gov.address);
  await tx.wait();
  tx = await gov.__acceptAdmin();
  await tx.wait();

  const Treasure = await new ethers.ContractFactory(TreasureAbi, TreasureByteCode, owner);
  const treasure = await Treasure.deploy({value:ethers.utils.parseUnits("100", 18)});
  await treasure.deployed();
  console.log("Treasure deployed to:", treasure.address);
  await writeAddr(treasure.address, "Treasure", network.name);
  tx = await treasure.transferOwnership(timelock.address);
  await tx.wait();
  console.log("treasure owner transfered to timelock");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
