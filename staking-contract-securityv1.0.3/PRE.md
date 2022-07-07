1. 部署代币
    npx hardhat deploy --tags KIKIToken --network goerli
2. 给出代币合约验证信息
    代币name
    代币symbol
    代币精度
    最大发行量
3. 部署 Seed Round TokenLocker
    npx hardhat deploy --tags SeedRoundTokenLocker --network goerli
4. 验证SeedRound锁仓信息
    锁仓金额
    FIRST_LOCK_PERCENT
    FIRST_LOCK_SECONDS
    LOCK_PERIOD
    LOCK_PERIOD_NUM
    3个月后收获 + 500,000
    4个月后收获 + 214285.7142857143
    5个月后收获 + 214285.7142857143
    6个月后收获 + 214285.7142857143
    7个月后收获 + 214285.7142857143
    8个月后收获 + 214285.7142857143
    9个月后收获 + 214285.7142857143
    10个月后收获 + 214285.7142857143
    11个月后收获 + 214285.7142857143
    12个月后收获 + 214285.7142857143
    13个月后收获 + 214285.7142857143
    14个月后收获 + 214285.7142857143
    15个月后收获 + 214285.7142857143
    16个月后收获 + 214285.7142857143
    17个月后收获 + 214285.7142857143
    18个月后收获 + 214285.7142857143
    19个月后收获 + 214285.7142857143
    20个月后收获 + 214285.7142857143
    21个月后收获 + 214285.7142857143
    22个月后收获 + 214285.7142857143
    23个月后收获 + 214285.7142857143
    24个月后收获 + 214285.7142857143
    25个月后收获 + 214285.7142857143
5. 部署PrivateFundTokenLocker
    npx hardhat deploy --tags PrivateFundTokenLocker --network goerli
6. 验证PrivateFund锁仓合约
    同上
7. 部署MarketTokenLocker
    npx hardhat deploy --tags MarketTokenLocker --network goerli
8. 验证MarketTokenLocker
9. 部署挖矿合约
    npx hardhat deploy --tags KIKIVault --network goerli
9. 部署TeamLocker
    npx hardhat deploy --tags TeamLocker --network goerli
10. 根据TokenHolder查看确认代币分布信息
    代币分布情况 一共 2000w释放到三个合约 剩余的8000w未释放
    挖矿占 6000w 最大释放量
    团队占 2000w 最大释放量
11. 移交Token权限
    npx hardhat deploy --tags TokenController --network goerli
12. 确认权限已移交完成
13. 



signer1: 0xe44c51aF9B8D1CF2a7427469662d41A01D28566D ed7143a9d515f096a0c2d0d4e1f4905a45edb94f38aa6572f9a82bf295204227
signer2: 0xC17467954aC0f98721D541AcB86D686C854E098e 414cd5f08efff60e256f4c272890b2e2e6edd197c107fbba0f4a2557e9e04ed3
signer3: 0xD2a41045cfCCd973C966943C55552ed62064EfBA 4e85d32a99f53f7078431e9c74e3f409026cc99e8aa1be157d43b77a24b39603

