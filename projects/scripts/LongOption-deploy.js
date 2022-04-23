// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');
const depolyedAirTokenAddr = require(`../deployments/${network.name}/AirToken.json`)
const { abi:LongOptionAbi, bytecode:LongOptionByteCode } = require('../artifacts/contracts/LongOption/LongOption.sol/LongOption.json');

async function main() {
  let [owner]  = await ethers.getSigners();
  const USDC = depolyedAirTokenAddr.address;
  // const USDC = '0x5B8B635c2665791cf62fe429cB149EaB42A3cEd8';
  const LongOption = await new ethers.ContractFactory(LongOptionAbi, LongOptionByteCode, owner);
  var _ETH = ethers.utils.parseUnits('100', 18);
  const longoption = await LongOption.deploy(10, ethers.utils.parseUnits('0.1', 18), ethers.utils.parseUnits('350', 18), ethers.utils.parseUnits('10', 18), USDC, {value: _ETH});
  await longoption.deployed();
  console.log("LongOption deployed to:", longoption.address);
  await writeAddr(longoption.address, "LongOption", network.name);
  // rinkeby deployed 0x1e59b82a31037a6cbd99e806b969377907eda7a3
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
