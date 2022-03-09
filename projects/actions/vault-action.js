const { ethers } = require("hardhat");

async function main() {
  let [owner]  = await ethers.getSigners();
  const WHERC20Token = await ethers.getContractFactory("WHERC20Token");
  const WHT = await WHERC20Token.attach("0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE");
  const vault = await ethers.getContractFactory("vault");
  const vaulttoken = await vault.attach("0x68B1D87F95878fE05B998F19b66F4baba5De1aed");
  // const WHT = await vault.attach("0xb4c2F523EF36fE4A2dc149cf0a96e73DC5e25829"); // ropsten上发布的合约

  var value = 10000000;
//   let value = ethers.utils.parseEther('10');
  console.log(value);

  // 查询owner的余额
  console.log("balance of this: " + owner.address + ", value: " + await vaulttoken.balanceOf(owner.address));
  
  // 授权vault
  await WHT.approve(vaulttoken.address, value);

  // 存款并查询余额
  await vaulttoken.deposit(value);
  console.log("balance of this: " + owner.address + ", value: " + await vaulttoken.balanceOf(owner.address));

  // 取款并查询余额
  await vaulttoken.withdraw(value);
  console.log("balance of this: " + owner.address + ", value: " + await vaulttoken.balanceOf(owner.address));
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

