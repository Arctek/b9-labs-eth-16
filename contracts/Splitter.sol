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
		require(receipient1 != address(0));
		require(receipient2 != address(0));
		require(receipient1 != receipient2);
		require(msg.value > 0);
	}

	function withdraw(uint withdrawAmount)
		isNotPaused
		isNotKilled
		public
		returns(bool success)
	{

	}
}
