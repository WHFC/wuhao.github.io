const { ethers } = require("hardhat");

async function main() {
  let [owner]  = await ethers.getSigners();
  const WHERC20Token = await ethers.getContractFactory("WHERC20Token");
  const WHT = await WHERC20Token.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  // const WHT = await WHERC20Token.attach("0xb4c2F523EF36fE4A2dc149cf0a96e73DC5e25829"); // ropsten上发布的合约

  console.log("name:" + await WHT.name());
  console.log("symbol:" + await WHT.symbol());
  console.log("totalSupply:" + await WHT.totalSupply());

  // 查询owner的余额
  console.log("balance of this: " + owner.address + ", value: " + await WHT.balanceOf(owner.address));
  // let value = '1000000000000000000';
  let value = ethers.utils.parseEther('1000000');

  // 增发代币并查询余额
  await WHT.mint(owner.address, value);
  console.log("balance of this: " + owner.address + ", value: " + await WHT.balanceOf(owner.address));

  // 给目标地址转账并查询余额
  let recipient = "0xf903462A3700B9CcAee36550688Ccafee482CD37";
  value = ethers.utils.parseEther('1');
  await WHT.transfer(recipient, value);
  console.log("transfer to:" + recipient + " , value:" + value + ", result: " + await WHT.balanceOf(recipient));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

