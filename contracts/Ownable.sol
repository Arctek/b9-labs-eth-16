pragma solidity ^0.4.4;

contract Ownable {
	address public owner;

	event LogSetOwner(address newOwner);

	modifier isOwner(){
      require(msg.sender == owner);
      _;
	}

	function Ownable() public{
		owner = msg.sender;
	}

	function setOwner(address newOwner) isOwner public returns(bool success) {
		require(newOwner != address(0));
		LogSetOwner(newOwner);
		owner = newOwner;
		return true;
	}
}
