// SPDX-License-Identifier: MIT

pragma solidity =0.6.6;

import '../uniswap-v2-periphery-master/contracts/interfaces/IUniswapV2Router01.sol';
import '../openzeppelin-contracts/contracts/token/ERC20/SafeERC20.sol';
import '../uniswap-v2-periphery-master/contracts/libraries/TransferHelper.sol';
import '../openzeppelin-contracts/contracts/math/SafeMath.sol';

interface IMasterChef {
    function deposit(uint256 _pid, uint256 _amount) external;
    function withdraw(uint256 _pid, uint256 _amount) external;
}

contract UniswapMarketV2 {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    // ropsten
    // address private constant router = 0xd507f9CA60a809358E1F0B88209DAE311cff74Fc;
    // address private constant WETH = 0x211848E6fe90c84099Ab46cD92b00cAa6952f4d5;
    // address private constant A = 0x12930419877125535D5F30E7eDB24eD204F6A735;
    // address private constant B = 0x8bBf5E921Dc75B3b8bA949F6cfF64ED250435F29;
    address private immutable router;
    address private immutable WETH;
    address private immutable token;
    address private immutable masterChef;
    address private immutable sushi;
    uint256 private immutable pid;
    mapping(address => uint256) public userTokenBalance;
    bool private locked;

    modifier lock() {
        require(!locked, "contract locked");
        locked = true;
        _;
        locked = false;
    }

    constructor(address _router, address _WETH, address _token, address _masterChef, address _sushi, uint256 _pid) public {
        router = _router;
        WETH = _WETH;
        token = _token;
        masterChef = _masterChef;
        sushi = _sushi;
        pid = _pid;
    }

    // msg.sender先调用tokenA的approve，授权给market合约amount数额
    function addLiquidity(
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to
    )
        external
        payable
        lock
        returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
    {
        require(address(0) != to, "UniswapMarket: address to invalid");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amountTokenDesired);
        IERC20(token).safeApprove(router, amountTokenDesired);
        (amountToken, amountETH, liquidity) = IUniswapV2Router01(router).addLiquidityETH{value:msg.value}(token, amountTokenDesired, amountTokenMin, amountETHMin, to, block.timestamp);
        // refund dust eth, if any
        if (msg.value > amountETH) TransferHelper.safeTransferETH(msg.sender, msg.value - amountETH);
        else if (amountTokenDesired > amountToken) IERC20(token).safeTransferFrom(address(this), msg.sender, amountTokenDesired - amountToken);
    }

    function buyToken(
        uint256 amountOutMin,
        address to
    ) external payable lock returns (uint256[] memory amounts) {
        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = token;
        amounts = IUniswapV2Router01(router).swapExactETHForTokens{value:msg.value}(amountOutMin, path, to, block.timestamp);
    }

    function buyTokenAndDopsiteToMaterChef(
        uint256 amountOutMin,
        address to
    ) external payable lock returns (uint256[] memory amounts) {
        address[] memory path = new address[] (2);
        path[0] = WETH;
        path[1] = token;
        amounts = IUniswapV2Router01(router).swapExactETHForTokens{value:msg.value}(amountOutMin, path, address(this), block.timestamp);
        if (msg.value > amounts[0]) {
            payable(msg.sender).call{value:msg.value.sub(amounts[0])}("");
        }
        IERC20(token).safeApprove(masterChef, amounts[1]);
        IMasterChef(masterChef).deposit(pid, amounts[1]);
        userTokenBalance[to] = userTokenBalance[to].add(amounts[1]);
    }

    function withDrawSushi(address to) external lock returns (bool) {
        require(address(0) != to, "invalid to address");
        IMasterChef(masterChef).withdraw(pid, userTokenBalance[msg.sender]);
        userTokenBalance[msg.sender] = 0;
        return true;
    } 
}