const BigNumber = require('bignumber.js')
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR })
module.exports = async function ({ ethers, getNamedAccounts, deployments, getChainId, getUnnamedAccounts }) {
  const { deploy } = deployments
  const { deployer } = await ethers.getNamedSigners()
  const { seedRoundReceiver } = await getNamedAccounts()
  const { signer1, signer2, signer3 } = await getNamedAccounts()
  let token = await ethers.getContract('KIKIToken')
  
  await deploy('SeedRoundMultiSignature', {
    from: deployer.address,
    args: [token.address, seedRoundReceiver, [signer1, signer2, signer3], 2],
    log: true,
    contract: 'MultiSignature',
  });
  let multiSignature = await ethers.getContract('SeedRoundMultiSignature');

  let maxSupply = await token.MAX_SUPPLY()
  maxSupply = new BigNumber(maxSupply.toString())
  let totalRelease = maxSupply.multipliedBy('5').dividedBy('100').toFixed(0) //5%
  let firstLockSeconds = 3 * 30 * 24 * 60 * 60 //3 month
  let firstLockPercent = new BigNumber('0.1').multipliedBy('1000000').toFixed(0); //10%
  let lockPeriod = 30 * 24 * 60 * 60 //1 month
  let lockPeriodNum = 21; //21 
  if (hre.network.tags.test) {
    firstLockSeconds = 5 * 60 //5 minute
    lockPeriod = 1 * 60 //1 minute
  }

  await deploy('SeedRoundTokenLocker', {
    from: deployer.address,
    args: ['SeedRound TokenLocker', 'SRTK', token.address, firstLockSeconds, firstLockPercent, lockPeriod, lockPeriodNum],
    log: true,
    contract: 'TokenLocker',
  })

  let tokenLocker = await ethers.getContract('SeedRoundTokenLocker')
  /*
  let releaseInfo = await tokenLocker.receivers(multiSignature.address)
  if (releaseInfo.receiver != multiSignature.address) {
    tx = await token.connect(deployer).mint(deployer.address, totalRelease)
    tx = await tx.wait()
    tx = await token.connect(deployer).approve(tokenLocker.address, totalRelease)
    tx = await tx.wait()
    tx = await tokenLocker.connect(deployer).addReceiver(multiSignature.address, totalRelease)
    tx = await tx.wait()
    console.log('create SeedRound  tokenLocker receiver: ' + multiSignature.address + ' totalRelease: ' + totalRelease)
  }
  */
}

module.exports.tags = ['SeedRoundTokenLocker']
module.exports.dependencies = ['KIKIToken']
