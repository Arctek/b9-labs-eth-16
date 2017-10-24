pragma solidity 0.4.17;

import "./Pauseable.sol";

contract Killable is Pauseable{
    bool public killed;
    bool public isWithdrawn;
    

    event LogKill(address who);
    event LogEmergencyWithdrawal(address who);

    modifier isKilled(){
        require(killed);
        _;
    }

    modifier isNotKilled(){
        require(!killed);
        _;
    }

    function kill() isOwner isNotKilled public returns(bool success) {
        LogKill(msg.sender);
        killed = true;
        return true;
    }

    function emergencyWithdrawal() isOwner isKilled public returns(bool success) {
        require(!isWithdrawn);
        LogEmergencyWithdrawal(msg.sender);
        isWithdrawn = true;
        msg.sender.transfer(this.balance);
        return true;
    }
}