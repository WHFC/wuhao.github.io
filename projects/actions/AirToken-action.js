const { ethers } = require("hardhat");
const { abi, bytecode } = require('../artifacts/flattened/AirToken/AirToken.sol/AirToken.json');
const depolyedAirTokenAddr = require(`../deployments/${network.name}/AirToken.json`)

async function main() {
  let [owner, owner2]  = await ethers.getSigners();
  const AirToken = await new ethers.ContractFactory(abi, bytecode, owner);
  const at = await AirToken.attach(depolyedAirTokenAddr.address);

  // 查询owner的余额
  console.log("balance of this: " + owner.address + ", value: " + await at.balanceOf(owner.address));

  // 给目标地址转账并查询余额
  value = ethers.utils.parseEther('1');
  await WHT.transfer(owner2.address, value);
  console.log("transfer to:" + recipient + " , value:" + value + ", result: " + await at.balanceOf(recipient));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

