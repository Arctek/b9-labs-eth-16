pragma solidity 0.4.17;

contract Ownable {
	address public owner;

	event LogSetOwner(address indexed oldOwner, address indexed newOwner);

	modifier isOwner(){
		require(msg.sender == owner);
		_;
	}

	function Ownable() public{
		owner = msg.sender;
	}

	function setOwner(address newOwner) public isOwner returns(bool success){
		require(newOwner != address(0));
		require(newOwner != owner);
		owner = newOwner;
		LogSetOwner(owner, newOwner);
		return true;
	}
}
