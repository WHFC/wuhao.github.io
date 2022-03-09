const { ethers, network } = require("hardhat");

async function main() {
  let [owner]  = await ethers.getSigners();
  let contractAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

  let ATC = await ethers.getContractAt("AirToken",
    contractAddress,
    owner);

  console.log("name:" + await ATC.name());
  console.log("symbol:" + await ATC.symbol());
  console.log("totalSupply:" + await ATC.totalSupply());
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});

