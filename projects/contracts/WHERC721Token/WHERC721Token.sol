// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./token/ERC721/ERC721.sol";

contract WHERC721Token is ERC721 {
    address private owner;
    uint256 private index;

    modifier onlyOwner() {
        require(msg.sender == owner, "only owner can call this function");
        _;
    }

    constructor() ERC721("WHERC721 NFT", "WHNFT") public {
        owner = msg.sender;
    }

    function mint(address to) external onlyOwner {
        _safeMint(to, index++);
    }

    function nextID() external view returns (uint256) {
        return index;
    }
}
