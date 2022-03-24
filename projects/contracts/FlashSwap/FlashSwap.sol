pragma solidity =0.6.6;

import '../uniswap-v2-core-master/contracts/interfaces/IUniswapV2Callee.sol';
import '../uniswap-v2-periphery-master/contracts/libraries/UniswapV2Library.sol';
import '../v3-periphery/contracts/libraries/PoolAddress.sol';
import '../v3-core/contracts/interfaces/IUniswapV3Factory.sol';
import '../v3-core/contracts/interfaces/IUniswapV3Pool.sol';
import '../uniswap-v2-periphery-master/contracts/interfaces/IERC20.sol';

contract FlashSwap is IUniswapV2Callee {
    IUniswapV3Factory immutable factoryV3;
    address immutable factory;
    address immutable tokenA;
    address immutable tokenB;
    IUniswapV3Pool immutable v3pool;
    uint256 public lastSwapAmountA;
    uint256 public lastPayBackAmoutA;
    uint256 public lastSwapAmountB;
    uint256 public lastPayBackAmoutB;

    constructor(address _factory, address _factoryV3, address _token0, address _token1) public {
        factoryV3 = IUniswapV3Factory(_factoryV3);
        factory = _factory;
        tokenA = _token0;
        tokenB = _token1;
        PoolAddress.PoolKey memory poolKey = PoolAddress.getPoolKey(_token0, _token1, 3000);
        v3pool = IUniswapV3Pool(PoolAddress.computeAddress(address(_factoryV3), poolKey));
    }

    // needs to accept ETH from any V1 exchange and WETH. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // gets tokens/WETH via a V2 flash swap, swaps for the TokenA/TokenB on V1, repays V2, and keeps the rest!
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {
        lastSwapAmountA = 0;
        lastPayBackAmoutA = 0;
        lastSwapAmountB = 0;
        lastPayBackAmoutB = 0;
        address[] memory path = new address[](2);
        uint amountTokenA;
        uint amountTokenB;
        { // scope for token{0,1}, avoids stack too deep errors
        address token0 = IUniswapV2Pair(msg.sender).token0();
        address token1 = IUniswapV2Pair(msg.sender).token1();
        assert(msg.sender == UniswapV2Library.pairFor(factory, token0, token1)); // ensure that msg.sender is actually a V2 pair
        assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
        path[0] = amount0 == 0 ? token0 : token1;
        path[1] = amount0 == 0 ? token1 : token0;
        amountTokenA = token0 == address(tokenA) ? amount0 : amount1;
        amountTokenB = token0 == address(tokenA) ? amount1 : amount0;
        }

        assert(path[0] == address(tokenA) || path[1] == address(tokenA));

        if (amountTokenA > 0) {
            lastSwapAmountA = amountTokenA;
            (uint minTokens) = abi.decode(data, (uint));
            // uint amountReceived = exchangeV1.ethToTokenSwapInput{value: amountETH}(minTokens, uint(-1));
            uint amountRequired = UniswapV2Library.getAmountsIn(factory, amountTokenA, path)[0];
            lastPayBackAmoutA = amountRequired;
            // assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan
            assert(IERC20(tokenA).transfer(msg.sender, amountRequired)); // return tokens to V2 pair
            // assert(token.transfer(sender, amountReceived - amountRequired)); // keep the rest! (tokens)
        } else {
            lastSwapAmountB = amountTokenB;
            (uint minTokens) = abi.decode(data, (uint));
            // uint amountReceived = exchangeV1.ethToTokenSwapInput{value: amountETH}(minTokens, uint(-1));
            uint amountRequired = UniswapV2Library.getAmountsIn(factory, amountTokenA, path)[0];
            lastPayBackAmoutB = amountRequired;
            // assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan
            assert(IERC20(tokenB).transfer(msg.sender, amountRequired)); // return tokens to V2 pair
            // assert(token.transfer(sender, amountReceived - amountRequired)); // keep the rest! (tokens)
        }
    }
}
