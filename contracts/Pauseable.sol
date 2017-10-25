pragma solidity 0.4.17;

import "./Ownable.sol";

contract Pauseable is Ownable{
    bool public paused;

    event LogSetPaused(address indexed who, bool indexed paused);

    modifier isPaused(){
        require(paused);
        _;
    }

    modifier isNotPaused(){
        require(!paused);
        _;
    }

    function setPaused(bool newPaused) isOwner public returns(bool success) {
        require(newPaused != paused);
        LogSetPaused(owner, newPaused);
        paused = newPaused;
        return true;
    }
}
