// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

interface airdrop {
    function transfer(address recipient, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function claim() external;
}

contract AddressForecast {
    uint256 private nonce = 1;

    // 根据合约new的次数nonce进行预测，与合约内容、构造参数无关。不能用于加盐的new
    function addressto(address _origin, uint256 _nonce) internal pure returns (address _address) {
        bytes memory data;
        if(_nonce == 0x00)          data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), _origin, bytes1(0x80));
        else if(_nonce <= 0x7f)     data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), _origin, uint8(_nonce));
        else if(_nonce <= 0xff)     data = abi.encodePacked(bytes1(0xd7), bytes1(0x94), _origin, bytes1(0x81), uint8(_nonce));
        else if(_nonce <= 0xffff)   data = abi.encodePacked(bytes1(0xd8), bytes1(0x94), _origin, bytes1(0x82), uint16(_nonce));
        else if(_nonce <= 0xffffff) data = abi.encodePacked(bytes1(0xd9), bytes1(0x94), _origin, bytes1(0x83), uint24(_nonce));
        else                        data = abi.encodePacked(bytes1(0xda), bytes1(0x94), _origin, bytes1(0x84), uint32(_nonce));
        bytes32 hash = keccak256(data);
        assembly {
            mstore(0, hash)
            _address := mload(0)
        }
    }
    // gas: 1073558 10次
    function callClaim(uint256 times) public {
        for(uint i=0;i<times;++i){
            address to = addressto(address(this), nonce);
            new claimer(to, address(msg.sender));
            nonce+=1;
        }
    }

    // 加盐且构造函数需要传入自身预测地址的合约，是无法完成预测的
    function testForecastAddress(uint256 salt) public returns (bytes32 hash, address _address, address _addressCreate2) {
        bytes32 _salt = keccak256(abi.encode(salt));
        bytes memory data;
        data = abi.encodePacked(bytes1(0xd6), bytes1(0x94), address(this), uint8(salt));
        bytes memory bytecode = type(TestContract).creationCode;
        bytecode = abi.encodePacked(bytecode, abi.encode(1, 2));
        data = abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode));
        hash = keccak256(data);
        // 加盐的new相当于使用的create2加盐创建合约
        // _addressCreate2 = address(new TestContract{salt: _salt}(1, 2));     // gas: 77251
        assembly {
            mstore(0, hash)
            _address := mload(0)
            _addressCreate2 := create2(0, add(bytecode, 32), mload(bytecode), _salt)        // gas: 76793
        }
    }

    // gas: 67830 
    function newContract(uint256 _salt) external returns (address result) {
        result = address(new TestContract{salt:keccak256(abi.encode(_salt))}(1, 2));
    }

    // gas: 69471 
    function newContractAssembly(uint256 salt) external returns (address result) {
        bytes32 _salt = keccak256(abi.encode(salt));
        bytes memory bytescode = abi.encodePacked(type(TestContract).creationCode, abi.encode(1, 2));
        assembly {
            result := create2(0, add(bytescode, 32), mload(bytescode), _salt)
        }
    }

    // gas: 68014 
    function newContract(bytes32 _salt) external returns (address result) {
        // result = address(new TestContract{salt:keccak256(abi.encode(salt))}(1, 2));
        result = address(new TestContract{salt:_salt}(1, 2));
    }

    // gas: 69477 
    function newContractAssembly(bytes32 _salt) external returns (address result) {
        // bytes32 _salt = keccak256(abi.encode(salt));
        bytes memory bytescode = abi.encodePacked(type(TestContract).creationCode, abi.encode(1, 2));
        assembly {
            result := create2(0, add(bytescode, 32), mload(bytescode), _salt)
        }
    }

    // gas: 25173
    function addressForce(uint256 salt) external view returns (address result) {
        // bytes memory bytescode = type(TestContract).creationCode;
        // bytescode = abi.encodePacked(bytescode, abi.encode(1, 2));
        // bytes32 hash = keccak256(abi.encodePacked(uint8(0xff), address(this), keccak256(abi.encode(salt)), keccak256(bytescode)));
        // result = address(uint160(uint256(hash)));
        result = address(uint160(uint256(keccak256(abi.encodePacked(uint8(0xff), address(this), keccak256(abi.encode(salt)), keccak256(abi.encodePacked(type(TestContract).creationCode, abi.encode(1, 2))))))));
    }

    // gas: 25280
    function addressForceAssembly(uint256 salt) external view returns (address result) {
        // bytes memory bytescode = abi.encodePacked(uint8(0xff), address(this), keccak256(abi.encode(salt)), keccak256(abi.encodePacked(type(TestContract).creationCode, abi.encode(1, 2))));
        bytes32 hash = keccak256(abi.encodePacked(uint8(0xff), address(this), keccak256(abi.encode(salt)), keccak256(abi.encodePacked(type(TestContract).creationCode, abi.encode(1, 2)))));
        assembly {
            mstore(0, hash)
            result := mload(0)
        }
    }

    function uint256ToBytes32(uint256 value) public pure returns (bytes32) {
        return keccak256(abi.encode(value));
    }

    function abiTest() public pure returns (bytes memory result1, bytes memory result2) {
        result1 = type(TestContract).creationCode;
        result2 = abi.encodePacked(result1, abi.encodePacked(uint256(128)), uint256(255));
    }

    function keccakTest() public pure returns (bytes32 result1, bytes32 result2) {
        bytes memory creationCode = type(TestContract).creationCode;
        bytes memory params = abi.encodePacked(uint256(1), uint256(2));
        result1 = keccak256(abi.encodePacked(creationCode, params));
        result2 = keccak256(abi.encodePacked(abi.encodePacked(creationCode), params));
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `master`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address master) internal returns (address instance) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, master))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `master`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `master` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address master, bytes32 salt) internal returns (address instance) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, master))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            instance := create2(0, ptr, 0x37, salt)
        }
        require(instance != address(0), "ERC1167: create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(address master, bytes32 salt, address deployer) internal pure returns (address predicted) {
        // solhint-disable-next-line no-inline-assembly
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x14), shl(0x60, master))
            mstore(add(ptr, 0x28), 0x5af43d82803e903d91602b57fd5bf3ff00000000000000000000000000000000)
            mstore(add(ptr, 0x38), shl(0x60, deployer))
            mstore(add(ptr, 0x4c), salt)
            mstore(add(ptr, 0x6c), keccak256(ptr, 0x37))
            predicted := keccak256(add(ptr, 0x37), 0x55)
        }
    }
    // gas: 1298025 10次
    function callClaim2(uint256 times) public {
        claimer2 c = new claimer2();
        for(uint i=1;i<times;++i){
            claimer2 to = claimer2(clone(address(c)));
            to.callClaim(address(msg.sender));
        }
        c.callClaim(address(msg.sender));
    }
    // gas: 1298025 10次
    function callClaim3(uint256 times) public {
        for(uint i=0;i<times;++i){
            new claimer3(address(msg.sender));
            nonce+=1;
        }
    }
}

contract claimer{
    constructor(address selfAdd, address receiver){
        address contra = address(0xd9145CCE52D386f254917e481eB44e9943F39138);
        airdrop(contra).claim();
        uint256 balance = airdrop(contra).balanceOf(selfAdd);
        require(balance > 0,'Oh no');
        airdrop(contra).transfer(receiver, balance);   // 1102178 10次
        selfdestruct(payable(address(msg.sender))); // 1077052 10次
    }
}

contract claimer2{
    constructor(){
    }
    function callClaim(address receiver) external {
        address contra = address(0xd9145CCE52D386f254917e481eB44e9943F39138);
        airdrop(contra).claim();
        uint256 balance = airdrop(contra).balanceOf(address(this));
        require(balance > 0,'Oh no');
        airdrop(contra).transfer(receiver, balance);
        selfdestruct(payable(address(msg.sender)));
    }
}

contract claimer3{
    constructor(address receiver){
        address contra = address(0xd9145CCE52D386f254917e481eB44e9943F39138);
        airdrop(contra).claim();
        uint256 balance = airdrop(contra).balanceOf(address(this));
        require(balance > 0,'Oh no');
        airdrop(contra).transfer(receiver, balance);   // 1102178 10次
        selfdestruct(payable(address(msg.sender))); // 1077052 10次
    }
}

contract TestContract {
    constructor (uint256 x, uint256 y) {

    }
}