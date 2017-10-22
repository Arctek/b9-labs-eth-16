pragma solidity ^0.4.4;

// TODO: Everything

contract Splitter {
	mapping(address => uint) public recipientbalances;

	event LogSplit(address sender, address recipient1, address receipient2, bool hasRemainder);
	event LogWithdraw(address recipient, uint withdrawAmount);

	function split(address recipient1, address recipient2) 
		isNotPaused
		isNotKilled
		payable
		public
		returns(bool success)
	{

	}

	function withdraw(uint withdrawAmount)
		isNotPaused
		isNotKilled
		public
		returns(bool success)
	{

	}
}
