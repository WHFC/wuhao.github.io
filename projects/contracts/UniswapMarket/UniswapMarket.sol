// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../uniswap-v2-periphery-master/contracts/interfaces/IUniswapV2Router02.sol';

contract UniswapMarket {
    // ropsten
    // address private constant router = 0xd507f9CA60a809358E1F0B88209DAE311cff74Fc;
    // address private constant WETH = 0x211848E6fe90c84099Ab46cD92b00cAa6952f4d5;
    // address private constant A = 0x12930419877125535D5F30E7eDB24eD204F6A735;
    // address private constant B = 0x8bBf5E921Dc75B3b8bA949F6cfF64ED250435F29;
    address private constant router = 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;
    address private constant WETH = 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;
    address private constant A = 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9;
    address private constant B = 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9;
    mapping(address => mapping(address => uint256)) public tokenBalances;

    function depositTokenA(uint256 amount) external returns (bool) {
        return depositToken(A, amount);
    }

    function depositTokenB(uint256 amount) external returns (bool result) {
        return depositToken(B, amount);
    }
    
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(tokenBalances[A][msg.sender] >= amountADesired, "UniswapMarket: not enough tokenA");
        require(tokenBalances[B][msg.sender] >= amountBDesired, "UniswapMarket: not enough tokenB");
        tokenBalances[A][msg.sender] -= amountADesired;
        tokenBalances[B][msg.sender] -= amountBDesired;
        require(approveToRouter(A, amountADesired), "UniswapMarket: token A approve to router failed");
        require(approveToRouter(B, amountBDesired), "UniswapMarket: token B approve to router failed");
        uint256 deadline = block.timestamp + 1 hours;
        bytes memory payload = abi.encodeWithSignature("addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)"
        , A
        , B
        , amountADesired
        , amountBDesired
        , amountAMin
        , amountBMin
        , to
        , deadline);
        assembly {
            let result := call(gas(), router, 0, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                amountA := mload(0)
                amountB := mload(0x20)
                liquidity := mload(0x40)
            }
        }
    }

    function buyTokenA(
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint[] memory amounts) {
        return buyToken(B, A, amountIn, amountOutMin, to);
    }

    function buyTokenB(
        uint256 amountIn,
        uint256 amountOutMin,
        address to
    ) external returns (uint[] memory amounts) {
        return buyToken(A, B, amountIn, amountOutMin, to);
    }

    function depositToken(address token, uint256 amount) internal returns (bool result) {
        bytes memory payload = abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount);
        assembly {
            let _result := call(gas(), token, 0, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch _result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                result := mload(0)
            }
        }
        require(result, "UniswapMarket: transfer failed");
        tokenBalances[token][msg.sender] += amount;
    }

    function approveToRouter(address token, uint256 amount) public returns (bool result) {
        bytes memory payload = abi.encodeWithSignature("approve(address,uint256)", router, amount);
        assembly {
            let _result := call(gas(), token, 0, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch _result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                result := mload(0)
            }
        }
    }

    function buyToken(address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin, address to) internal returns (uint[] memory) {
        // require(approveToRouter(tokenIn, amountIn), "UniswapMarket: approve to router failed");
        uint256 deadline = block.timestamp + 1 hours;
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        bytes memory payload = abi.encodeWithSignature("swapExactTokensForTokens(uint256,uint256,address[],address,uint256)", amountIn, amountOutMin, path, to, deadline);
        assembly {
            let result := delegatecall(gas(), router, add(payload, 0x20), mload(payload), 0, 0)

            returndatacopy(0, 0, returndatasize())

            switch result
            // delegatecall returns 0 on error.
            case 0 { revert(0, returndatasize()) }
            default { 
                return(0, returndatasize())
            }
        }
        tokenBalances[tokenIn][msg.sender] -= amountIn;
    }
}