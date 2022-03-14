const { ethers } = require("hardhat");
const { writeAddr } = require('../actions/artifact_log.js');

async function main() {
  const WHERC721Token = await ethers.getContractFactory("WHERC721Token");
  const token = await WHERC721Token.deploy();

  await token.deployed();
  await writeAddr(token.address, "WHERC721Token", network.name);
  console.log("WHERC721Token deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
