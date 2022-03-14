const { ethers } = require("hardhat");

const depolyedAddr = require(`../deployments/${network.name}/WHERC721Token.json`)

async function main() {
  let [owner]  = await ethers.getSigners();
  const WHERC721Token = await ethers.getContractFactory("WHERC721Token");
  const WHNFT = await WHERC721Token.attach(depolyedAddr.address);

  console.log("name:" + await WHNFT.name());
  console.log("symbol:" + await WHNFT.symbol());
  console.log("totalSupply:" + await WHNFT.totalSupply());

  // 查询owner的持有数量
  console.log("balance of this: " + owner.address + ", count: " + await WHNFT.balanceOf(owner.address));

  var count = 10;
  let tokenID = 0;
  while (count-- >= 0) {
    tokenID = WHNFT.nextID();
    // 增发代币并查询持有数量
    await WHNFT.mint(owner.address);
    console.log("balance of this: " + owner.address + ", count: " + await WHNFT.balanceOf(owner.address));
  }

  // 给目标地址转账并查询持有数量
  let recipient = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8";
  await WHNFT.transferFrom(owner.address, recipient, tokenID);
  console.log("transfer to:" + recipient + " , value:" + tokenID + ", result: " + await WHNFT.balanceOf(recipient));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

