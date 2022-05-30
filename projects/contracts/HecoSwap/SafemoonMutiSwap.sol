// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "../uniswap-v2-periphery-master/contracts/libraries/UniswapV2Library.sol";
import "../uniswap-v2-core-master/contracts/interfaces/IUniswapV2Pair.sol";
import "../uniswap-v2-core-master/contracts/interfaces/IERC20.sol";

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