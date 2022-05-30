// Sources flattened with hardhat v2.9.0 https://hardhat.org

// File contracts/uniswap-v2-core-master/contracts/interfaces/IUniswapV2Pair.sol

pragma solidity >=0.5.0;

interface IUniswapV2Pair {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);

    function DOMAIN_SEPARATOR() external view returns (bytes32);
    function PERMIT_TYPEHASH() external pure returns (bytes32);
    function nonces(address owner) external view returns (uint);

    function permit(address owner, address spender, uint value, uint deadline, uint8 v, bytes32 r, bytes32 s) external;

    event Mint(address indexed sender, uint amount0, uint amount1);
    event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint amount0In,
        uint amount1In,
        uint amount0Out,
        uint amount1Out,
        address indexed to
    );
    event Sync(uint112 reserve0, uint112 reserve1);

    function MINIMUM_LIQUIDITY() external pure returns (uint);
    function factory() external view returns (address);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function price0CumulativeLast() external view returns (uint);
    function price1CumulativeLast() external view returns (uint);
    function kLast() external view returns (uint);

    function mint(address to) external returns (uint liquidity);
    function burn(address to) external returns (uint amount0, uint amount1);
    function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external;
    function skim(address to) external;
    function sync() external;

    function initialize(address, address) external;
}


// File contracts/uniswap-v2-periphery-master/contracts/libraries/SafeMath.sol

pragma solidity >=0.6.6;

// a library for performing overflow-safe math, courtesy of DappHub (https://github.com/dapphub/ds-math)

library SafeMath {
    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, 'ds-math-add-overflow');
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, 'ds-math-sub-underflow');
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, 'ds-math-mul-overflow');
    }
}


// File contracts/uniswap-v2-periphery-master/contracts/libraries/UniswapV2Library.sol

pragma solidity >=0.5.0;
library UniswapV2Library {
    using SafeMath for uint;

    // returns sorted token addresses, used to handle return values from pairs sorted in this order
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, 'UniswapV2Library: IDENTICAL_ADDRESSES');
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'UniswapV2Library: ZERO_ADDRESS');
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint160(uint(keccak256(abi.encodePacked(
                hex'ff',
                factory,
                keccak256(abi.encodePacked(token0, token1)),
                hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' // init code hash
                // hex'9711eca875d6b1d47c2c5d0f07804216fa3a6dda42bf49023199724108b24837' // init code hash
            )))));
    }

    // fetches and sorts the reserves for a pair
    function getReserves(address factory, address tokenA, address tokenB) internal view returns (uint reserveA, uint reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        (uint reserve0, uint reserve1,) = IUniswapV2Pair(pairFor(factory, tokenA, tokenB)).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
    }

    // given some amount of an asset and pair reserves, returns an equivalent amount of the other asset
    function quote(uint amountA, uint reserveA, uint reserveB) internal pure returns (uint amountB) {
        require(amountA > 0, 'UniswapV2Library: INSUFFICIENT_AMOUNT');
        require(reserveA > 0 && reserveB > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        amountB = amountA.mul(reserveB) / reserveA;
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) internal pure returns (uint amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint amountInWithFee = amountIn.mul(997);
        uint numerator = amountInWithFee.mul(reserveOut);
        uint denominator = reserveIn.mul(1000).add(amountInWithFee);
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) internal pure returns (uint amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint numerator = reserveIn.mul(amountOut).mul(1000);
        uint denominator = reserveOut.sub(amountOut).mul(997);
        amountIn = (numerator / denominator).add(1);
    }

    // performs chained getAmountOut calculations on any number of pairs
    function getAmountsOut(address factory, uint amountIn, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i; i < path.length - 1; i++) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
        }
    }

    // performs chained getAmountIn calculations on any number of pairs
    function getAmountsIn(address factory, uint amountOut, address[] memory path) internal view returns (uint[] memory amounts) {
        require(path.length >= 2, 'UniswapV2Library: INVALID_PATH');
        amounts = new uint[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint i = path.length - 1; i > 0; i--) {
            (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
        }
    }
}


// File contracts/uniswap-v2-core-master/contracts/interfaces/IERC20.sol

pragma solidity >=0.5.0;

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
}


// File contracts/HecoSwap/SafemoonMutiSwap.sol

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor () {
        address msgSender = _msgSender();
        _owner = msgSender;
        emit OwnershipTransferred(address(0), msgSender);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

contract SafemoonMutiSwap is Ownable {
    struct SPairsInfo {
        address safemoon;
        address pair;
        bool valid;
        bool otherIsUSDT;
    }

    address public immutable pairWETHAndUSDT;
    address public immutable USDT;
    SPairsInfo[] public swapPairs;
    mapping(address => uint256) public swapPairIndex;
    
    event AddSwapPair(address indexed pair, address indexed safemoon, uint256 indexed id);
    event UpdateSwapPair(address indexed pair, bool indexed valid, uint256 indexed id);
    event RemoveSwapPair(address indexed pair, uint256 indexed id);
    event SwapPairIDChanged(address indexed pair, uint256 indexed idOld, uint256 indexed idNew);

    constructor(address _pairWETHAndUSDT, address _USDT) {
        pairWETHAndUSDT = _pairWETHAndUSDT;
        USDT = _USDT;
    }

    function addSwapPair(address safemoon, address pair, bool otherIsUSDT) external onlyOwner returns (uint256) {
        require(!havePair(pair), "SMS::addSwapPair: aready have");
        uint256 id = swapPairs.length;
        SPairsInfo storage info = swapPairs.push();
        info.safemoon = safemoon;
        info.pair = pair;
        info.valid = true;
        info.otherIsUSDT = otherIsUSDT;
        swapPairIndex[info.pair] = id;
        emit AddSwapPair(pair, safemoon, id);
        return id;
    }

    function updateSwapPairInfo(uint256 id, bool valid) external onlyOwner {
        require(swapPairs.length > id, "SMS::addSwapPair: invalid id");
        SPairsInfo storage info = swapPairs[id];
        info.valid = valid;
        emit UpdateSwapPair(info.pair, valid, id);
    }

    function removeSwapPair(uint256 id) external onlyOwner {
        require(swapPairs.length > id, "SMS::addSwapPair: invalid id");
        address pairRemoved;
        if (swapPairs.length == 1) {
            pairRemoved = swapPairs[id].pair;
            swapPairIndex[pairRemoved] = 0;
            swapPairs.pop();
        } else {
            uint256 lastID = swapPairs.length - 1;
            SPairsInfo storage info = swapPairs[lastID];
            swapPairs.pop();
            pairRemoved = swapPairs[id].pair;
            swapPairIndex[pairRemoved] = 0;
            swapPairs[id] = info;
            swapPairIndex[info.pair] = id;
            emit SwapPairIDChanged(info.pair, lastID, id);
        }
        emit RemoveSwapPair(pairRemoved, id);
    }

    function mutiSwap(uint256[] calldata ids, address to, uint256 price) external onlyOwner {
        uint256 outWETHAmount;
        uint256 outUSDTAmount;
        for (uint256 i = 0; i < ids.length; ++i) {
            if (ids[i] >= swapPairs.length || !swapPairs[ids[i]].valid) {
                continue;
            }
            SPairsInfo memory info = swapPairs[ids[i]];
            ( uint256 amountOut, bool success ) = trySwap(info.safemoon, info.pair, to);
            if (!success || (0 == amountOut)) {
                continue;
            }
            if (info.otherIsUSDT) {
                outUSDTAmount += amountOut;
            } else {
                outWETHAmount += amountOut;
            }
        }
        require(getOutWETHByUSDT(outUSDTAmount) + outWETHAmount> price, "SMS::mutiSwap: no profit");
    }

    function getSwapPairInfo(uint256 id) external view returns (address safemoon, address pair, bool valid, bool otherIsUSDT) {
        require(swapPairs.length > id, "SMS::addSwapPair: invalid id");
        SPairsInfo memory info = swapPairs[id];
        safemoon = info.safemoon;
        pair = info.pair;
        valid = info.valid;
        otherIsUSDT = info.otherIsUSDT;
    }

    function trySwap(address safemoon, address pair, address to) public onlyOwner returns (uint256 result, bool success) {
        while(false) {
            uint256 amountOut;
            uint256 amountOut0;
            uint256 amountOut1;
            uint256 reserve0;
            uint256 reserve1;
            address token0 = IUniswapV2Pair(pair).token0();
            uint256 balance = IERC20(safemoon).balanceOf(pair);
            {
                (reserve0, reserve1, ) = IUniswapV2Pair(pair).getReserves();
                uint256 reserveSafemoon = token0 == safemoon ? reserve0 : reserve1;
                uint256 reserveOther = token0 == safemoon ? reserve1 : reserve0;
                uint256 amountIn = balance - reserveSafemoon;
                if (amountIn == 0) {
                    break;
                }
                amountOut = UniswapV2Library.getAmountOut(amountIn, reserveSafemoon, reserveOther);
                if (amountOut == 0) {
                    break;
                }
            }
            amountOut0 = token0 == safemoon ? 0 : amountOut;
            amountOut1 = token0 == safemoon ? amountOut : 0;
            try IUniswapV2Pair(pair).swap(amountOut0, amountOut1, to, new bytes(0)) {
                return (amountOut, true);
            } catch Error(string memory /*reason*/) {
                break;
            } catch (bytes memory /*lowLevelData*/) {
                break;
            }
        }
        return (0, false);
    }

    function havePair(address pair) public view returns (bool) {
        bool bRet = false;
        do {
            if (swapPairs.length == 0) {
                break;
            }
            if (swapPairIndex[pair] == 0 && (swapPairs[0].pair != pair)) {
                break;
            }
            bRet = true;
        } while(false);
        return bRet;
    }

    function getOutWETHByUSDT(uint256 amountUSDT) internal view returns (uint256) {
        address token0 = IUniswapV2Pair(pairWETHAndUSDT).token0();
        ( uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(pairWETHAndUSDT).getReserves();
        uint256 reserveUSDT = token0 == USDT ? reserve0 : reserve1;
        uint256 reserveWETH = token0 == USDT ? reserve1 : reserve0;
        return UniswapV2Library.getAmountOut(amountUSDT, reserveUSDT, reserveWETH);
    }
}
