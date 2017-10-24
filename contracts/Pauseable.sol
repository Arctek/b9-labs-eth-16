pragma solidity 0.4.17;

import "./Ownable.sol";

contract Pauseable is Ownable{
    bool public paused;

    event LogSetPaused(bool paused);

    modifier isPaused(){
        require(paused);
        _;
    }

    modifier isNotPaused(){
        require(!paused);
        _;
    }

    function setPaused(bool newPaused) isOwner public returns(bool success) {
        LogSetPaused(newPaused);
        paused = newPaused;
        return true;
    }
}
