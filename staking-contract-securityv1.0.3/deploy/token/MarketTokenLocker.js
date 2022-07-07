const BigNumber = require('bignumber.js')
BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_FLOOR })
module.exports = async function ({ ethers, getNamedAccounts, deployments, getChainId, getUnnamedAccounts }) {
  const { deploy } = deployments
  const { deployer } = await ethers.getNamedSigners()
  const { marketReceiver } = await getNamedAccounts()
  const { signer1, signer2, signer3 } = await getNamedAccounts()
  let token = await ethers.getContract('KIKIToken')
  
  await deploy('MarketMultiSignature', {
    from: deployer.address,
    args: [token.address, marketReceiver, [signer1, signer2, signer3], 2],
    log: true,
    contract: 'MultiSignature',
  });
  let multiSignature = await ethers.getContract('MarketMultiSignature');

  let maxSupply = await token.MAX_SUPPLY()
  maxSupply = new BigNumber(maxSupply.toString())
  let totalRelease = maxSupply.multipliedBy('1').dividedBy('100').toFixed(0) //1%
  let firstLockSeconds = 0;
  let firstLockPercent = new BigNumber('0.0027397260273972603').multipliedBy('1000000').toFixed(0); //0%
  let lockPeriod = 24 * 60 * 60 //1 day
  let lockPeriodNum = 364; //365
  if (hre.network.tags.test) {
    lockPeriod = 10 * 60 //1 minute
  }

  await deploy('MarketTokenLocker', {
    from: deployer.address,
    args: ['Market TokenLocker', 'MTK', token.address, firstLockSeconds, firstLockPercent, lockPeriod, lockPeriodNum],
    log: true,
    contract: 'TokenLocker',
  })

  let tokenLocker = await ethers.getContract('MarketTokenLocker')

  let releaseInfo = await tokenLocker.receivers(multiSignature.address)
  if (releaseInfo.receiver != multiSignature.address) {
    tx = await token.connect(deployer).mint(deployer.address, totalRelease)
    tx = await tx.wait()
    tx = await token.connect(deployer).approve(tokenLocker.address, totalRelease)
    tx = await tx.wait()
    tx = await tokenLocker.connect(deployer).addReceiver(multiSignature.address, totalRelease)
    tx = await tx.wait()
    console.log('create Market  tokenLocker receiver: ' + multiSignature.address + ' totalRelease: ' + totalRelease)
  }
}

module.exports.tags = ['MarketTokenLocker']
module.exports.dependencies = ['KIKIToken']
