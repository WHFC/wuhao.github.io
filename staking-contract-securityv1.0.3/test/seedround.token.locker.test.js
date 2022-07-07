const chai = require('chai')
const expect = chai.expect
const BigNumber = require('BigNumber.js');
//console.dir(chai);
//chai.should()
//chai.use(chaiAsPromised)

describe('SeedRoundTokenLocker', () => {
    before(async function () {
        await deployments.fixture(['SeedRoundTokenLocker'])
        const { deployer } = await ethers.getNamedSigners()
        const { seedRoundReceiver } = await getNamedAccounts()
        const { signer1, signer2, signer3 } = await ethers.getNamedSigners()
        this.deployer = deployer
        this.seedRoundReceiver = seedRoundReceiver;
        this.signer1 = signer1;
        this.signer2 = signer2;
        this.signer3 = signer3;

        this.multiSignature = await ethers.getContract('SeedRoundMultiSignature');
        this.tokenLocker = await ethers.getContract('SeedRoundTokenLocker')
        this.token = await ethers.getContract('KIKIToken')
        let maxSupply = await this.token.MAX_SUPPLY()
        maxSupply = new BigNumber(maxSupply.toString())
        this.totalRelease = maxSupply.multipliedBy('5').dividedBy('100').toFixed(0) //5%
        this.startSeconds = Math.floor(new Date() / 1000);
        console.log("this.startSeconds: ", this.startSeconds);
    })

    beforeEach(async function () {})

    it('Claim', async function () {
        let more = false;
        let i = 0;
        do {
            let releaseInfo = await this.tokenLocker.getReleaseInfo(this.multiSignature.address);
            let nextReleaseAt = releaseInfo.nextReleaseAt.toNumber();
            let nextReleaseAmount = releaseInfo.nextReleaseAmount.toString();
            let alreadyReleaseAmount = releaseInfo.alreadyReleaseAmount.toString();
            let remainReleaseAmount = releaseInfo.remainReleaseAmount.toString();

            let passSeconds = nextReleaseAt - this.startSeconds;
            let balanceBefore = new BigNumber((await this.token.balanceOf(this.multiSignature.address)).toString());
            let currentTimestamp = (await ethers.provider.getBlock()).timestamp;
            if (currentTimestamp < nextReleaseAt) {
                await ethers.provider.send('evm_mine', [nextReleaseAt])
            }
            await this.tokenLocker.claim(this.multiSignature.address);
            let balanceAfter = new BigNumber((await this.token.balanceOf(this.multiSignature.address)).toString());
            let claimed = balanceAfter.minus(balanceBefore).dividedBy("1000000000000000000").toFixed(18);
            let totalClaimed = new BigNumber(balanceAfter.toString()).dividedBy("1000000000000000000").toFixed(18);
            let remaindRelease = new BigNumber((await this.token.balanceOf(this.tokenLocker.address)).toString()).dividedBy("1000000000000000000").toFixed(18);
            console.log(++i, passSeconds, claimed, totalClaimed, remaindRelease);
            more = (new BigNumber(remaindRelease)).comparedTo('0') > 0;
            this.startSeconds = nextReleaseAt;
        } while (more);
    })

    it('ApplyToken', async function () {
        let salt = ethers.utils.formatBytes32String("test123");
        let tx = await this.multiSignature.applyToken(this.totalRelease, this.startSeconds + 100000, salt);
        tx = await tx.wait();
        let args = tx.events[0].args;
        await this.multiSignature.connect(this.signer1).acceptApplyToken(args.requester, args.amount.toString(), args.requestAt.toString(), args.expireAt.toString(), args.salt);
        await this.multiSignature.connect(this.signer2).acceptApplyToken(args.requester, args.amount.toString(), args.requestAt.toString(), args.expireAt.toString(), args.salt);
        console.log((await this.token.balanceOf(this.seedRoundReceiver)).toString());
        expect(await this.token.balanceOf(this.seedRoundReceiver)).to.be.equal(this.totalRelease);
    })

})
