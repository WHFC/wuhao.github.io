const { ethers } = require("hardhat");

const { abi:wethAbi, bytecode:wethBytecode } = require('../artifacts/contracts/uniswap-v2-periphery-master/contracts/test/WETH9.sol/WETH9.json');

async function main() {
    let [owner] = await ethers.getSigners();
    console.log(owner.address);
    const WETH9 = await new ethers.ContractFactory(wethAbi, wethBytecode, owner);
    const weth = await WETH9.attach("0xb7eca5eAA51c678B97AE671df511bDdE2CE99896");
    let balance = await weth.balanceOf("0x4aA75B837daF1FdB328EF3731401aa3B03c002C1");
    console.log("balance: ", balance);
    let tx = await weth.withdraw(balance, { gasLimit:3000000});
    await tx.wait();
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});