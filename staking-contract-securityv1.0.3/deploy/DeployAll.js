module.exports = async function ({
    ethers,
    getNamedAccounts,
    deployments,
    getChainId,
    getUnnamedAccounts,
}) {
};

module.exports.tags = ['DeployAll'];
module.exports.dependencies = ['KIKIToken', 'SeedRoundTokenLocker', 'PrivateFundTokenLocker', 'MarketTokenLocker', 'KIKIVault', 'TeamLocker'];
