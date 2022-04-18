// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

// TODO: use assembly for this library
library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256 result) {
        assembly {
            result := add(a, b)
            if or(lt(result, a), lt(result, b)) {
                revert(0, 0)
            }
        }
        // uint256 c = a + b;
        // require(c >= a, "SafeMath: addition overflow");
        // return c;
    }
    
    function sub(uint256 a, uint256 b) internal pure returns (uint256 result) {
        assembly {
            if lt(a, b) {
                revert(0, 0)
            }
            result := sub(a, b)
        }
        // 等同于
        // require(b <= a);
        // return a - b;
    }
    
    // function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    //     if (a == 0) return 0;
    //     uint256 c = a * b;
    //     require(c / a == b, "SafeMath: multiplication overflow");
    //     return c;
    // }

    // function div(uint256 a, uint256 b) internal pure returns (uint256) {
    //     require(b > 0, "SafeMath: division by zero");
    //     return a / b;
    // }

    // function mod(uint256 a, uint256 b) internal pure returns (uint256) {
    //     require(b > 0, "SafeMath: modulo by zero");
    //     return a % b;
    // }
}

library AddressMapToUint256 {

    function insert(mapping(address => uint256) storage self, address key, uint256 value) internal {
        assembly {
            mstore(mload(0x40), key)
            mstore(add(mload(0x40), 32), self.slot)
            sstore(keccak256(mload(0x40), 64), value)
        }
    }

    function get(mapping(address => uint256) storage self, address key) internal view returns (uint256 result) {
        assembly {
            mstore(mload(0x40), key)
            mstore(add(mload(0x40), 32), self.slot)
            result := sload(keccak256(mload(0x40), 64))
        }
    }
    
    function addStore(mapping(address => uint256) storage self, address key, uint256 value) internal {
        assembly {
            mstore(mload(0x40), key)
            mstore(add(mload(0x40), 32), self.slot)
            let slot := keccak256(mload(0x40), 64)
            let old := sload(slot)
            if or(lt(add(old, value), old), lt(add(old, value), value)) { revert(0, 0) }
            sstore(slot, add(old, value))
        }
    }
    
    function subStore(mapping(address => uint256) storage self, address key, uint256 value) internal {
        assembly {
            mstore(mload(0x40), key)
            mstore(add(mload(0x40), 32), self.slot)
            let slot := keccak256(mload(0x40), 64)
            let old := sload(slot)
            if gt(value, old) { revert(0, 0) }
            sstore(slot, sub(old, value))
        }
    }
}

library AddressMapTo_AddressMapToUint256 {
    
    function insert(mapping(address => mapping(address => uint256)) storage self, address key1, address key2, uint256 value) internal {
        assembly {
            let pos := mload(0x40)
            mstore(pos, key1)
            mstore(add(pos, 32), self.slot)
            mstore(add(pos, 32), keccak256(pos, 64))
            mstore(pos, key2)
            sstore(keccak256(pos, 64), value)
        }
    }

    // return self[key1][key2]
    function get(mapping(address => mapping(address => uint256)) storage self, address key1, address key2) internal view returns (uint256 result) {
        assembly {
            let pos := mload(0x40)
            mstore(pos, key1)
            mstore(add(pos, 32), self.slot)
            mstore(add(pos, 32), keccak256(pos, 64))
            mstore(pos, key2)
            result := sload(keccak256(pos, 64))
        }
    }
}

contract ERC20Assembly is IERC20 {
    using SafeMath for uint256;
    using AddressMapToUint256 for mapping (address => uint256);
    using AddressMapTo_AddressMapToUint256 for mapping (address => mapping (address => uint256));

    address private _owner;
    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;
    uint8 private _decimals;

    // "Approval(address,address,uint256)" keccak256 hash
    bytes32 internal constant approvalTopic = 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925;
    // "Transfer(address,address,uint256)" keccak256 hash
    bytes32 internal constant transferTopic = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef;

    constructor (string memory name_, string memory symbol_) {
        _owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        _decimals = 18;
    }

    modifier onlyOwner() {
        assembly {
            if xor(caller(), sload(_owner.slot)) {
                revert(0, 0)
            }
        }
        _;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return _decimals;
    }

    function totalSupply() public view virtual override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual override returns (uint256) {
        return _balances.get(account);
    }

    function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        return _allowances.get(owner, spender);
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public virtual override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender].sub(amount));
        return true;
    }

    function mint(address account, uint256 amount) public onlyOwner returns (bool) {
        _mint(account, amount);
        return true;
    }

    function burn(address account, uint256 amount) public onlyOwner returns (bool) {
        _burn(account, amount);
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) internal virtual {
        assembly {
            if or(iszero(owner), iszero(spender)) {
                revert(0, 0)
            }
        }
        _allowances.insert(owner, spender, amount);
        assembly {
            mstore(0, amount)
            log3(0, 32, approvalTopic, owner, spender)
        }
        // 等同于
        // require(owner != address(0));
        // require(spender != address(0));
        // _allowances.insert(owner, spender, amount);
        // emit Approval(owner, spender, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal virtual {
        assembly {
            if or(iszero(sender), iszero(recipient)) {
                revert(0, 0)
            }
        }
        _balances.subStore(sender, amount);
        _balances.addStore(recipient, amount);
        assembly {
            mstore(0, amount)
            log3(0, 32, transferTopic, sender, recipient)
        }
        // 等同于
        // require(sender != address(0));
        // require(recipient != address(0));
        // _balances[sender] = _balances[sender].sub(amount);
        // _balances[recipient] = _balances[recipient].add(amount);
        // emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal virtual {
        notZeroAddress(account);
        assembly {
            let slot := _totalSupply.slot
            let old := sload(slot)
            if or(lt(add(old, amount), old), lt(add(old, amount), amount)) { revert(0, 0) }
            sstore(slot, add(old, amount))
        }
        _balances.addStore(account, amount);
        assembly {
            mstore(0, amount)
            log3(0, 32, transferTopic, mload(0x60), account)
        }

        // 等同于
        // require(account != address(0));
        // _totalSupply = _totalSupply.add(amount);
        // _balances[account] = _balances[account].add(amount);
        // emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal virtual {
        notZeroAddress(account);
        _balances.subStore(account, amount);
        assembly {
            let slot := _totalSupply.slot
            let old := sload(slot)
            if gt(amount, old) { revert(0, 0) }
            sstore(slot, sub(old, amount))
        }
        assembly {
            mstore(0, amount)
            log3(0, 32, transferTopic, account, mload(0x60))
        }

        // 等同于
        // require(account != address(0));
        // _balances[account] = _balances[account].sub(amount);
        // _totalSupply = _totalSupply.sub(amount);
        // emit Transfer(account, address(0), amount);
    }

    function notZeroAddress(address addr) internal pure {
        assembly {
            if iszero(addr) {
                revert(0, 0)
            }
        }
    }
}