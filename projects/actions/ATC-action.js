const { ethers, network } = require("hardhat");

async function main() {
  let [owner]  = await ethers.getSigners();
  // let [owner]  = "0x4aA75B837daF1FdB328EF3731401aa3B03c002C1";
  // let contractAddress = "0x1D52c819E28E9C7BD1B5fa28DCFDcb48082268D4";

  // let ATC = await ethers.getContractAt("AirToken",
  //   contractAddress,
  //   owner);
  const ATCToken = await ethers.getContractFactory("AirToken");
  const ATC = await ATCToken.attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
  // const ATC = await ATCToken.attach("0xb4c2F523EF36fE4A2dc149cf0a96e73DC5e25829"); // ropsten上发布的合约

  // console.log("name:" + await ATC.name());
  // console.log("symbol:" + await ATC.symbol());
  // console.log("totalSupply:" + await ATC.totalSupply());
  console.log("balance of this: " + owner.address + ", value: " + await ATC.balanceOf(owner.address));
  // let value = '1000000000000000000';
  let value = ethers.utils.parseEther('100');
  let recipient = "0xf903462A3700B9CcAee36550688Ccafee482CD37";
  await ATC.transfer(recipient, value);
  console.log("transfer to:" + recipient + " , value:" + value + ", result: " + await ATC.balanceOf(recipient));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

