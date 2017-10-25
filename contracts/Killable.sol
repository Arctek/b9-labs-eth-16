pragma solidity 0.4.17;

import "./Pauseable.sol";

contract Killable is Pauseable{
    bool public killed;
    bool public isWithdrawn;

    event LogKill(address indexed who);
    event LogEmergencyWithdrawal(address indexed who);

    modifier isKilled(){
        require(killed);
        _;
    }

    modifier isNotKilled(){
        require(!killed);
        _;
    }

    function kill() public isOwner isPaused isNotKilled returns(bool success){
        LogKill(msg.sender);
        killed = true;
        return true;
    }

    function emergencyWithdrawal() public isOwner isKilled returns(bool success){
        require(!isWithdrawn);
        isWithdrawn = true;
        msg.sender.transfer(this.balance);
        LogEmergencyWithdrawal(msg.sender);
        //suicide??
        return true;
    }
}