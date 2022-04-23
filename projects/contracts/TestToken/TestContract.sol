// SPDX-License-Identifier: GPL-3.0
pragma solidity >= 0.8.0;

/**
 * @title ERC20 interface
 * @dev see https://eips.ethereum.org/EIPS/eip-20
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract TestContract {
    string private _name;
    string private _sumbol;
    uint8 private _decimals;
    address _owner;
    address _token;
    bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));
    
    constructor (address token) {
        require(msg.sender != address(0));
        _name = "wh_test_contract";
        _sumbol = "WH_TEST_CONTRACT";
        _decimals = 18;
        _owner = msg.sender;
        _token = token;
    }

    function _safeTransfer(address token, address to, uint value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), 'UniswapV2: TRANSFER_FAILED');
    }
    
    function mintCall(address to, uint256 amount) external {
        _safeTransfer(_token, to, amount);
    }
    
    function mintTokenFunction(address to, uint256 amount) external {
        IERC20 irec20Token = IERC20(_token);
        irec20Token.transfer(to, amount);
    }
    
    function name() public view returns (string memory) {
        return _name;
    }
    
    function symbol() public view returns (string memory) {
        return _sumbol;
    }
    
    function decimals() public view returns (uint8) {
        return _decimals;
    }
}
