var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {
    var contract;

    var owner   = accounts[0];
    var bob     = accounts[1];
    var carol   = accounts[2];
    var david   = accounts[3];
    var emma    = accounts[4];

    beforeEach(function() {
        return Splitter.new({ from: owner }).then(instance => contract = instance);
    });

    // Split checks
    it('should not allow split on a paused contract', () => {
    });
   
    it('should not allow split on a killed contract', () => {
    });

    it('should not allow receipient1 to be null', () => {
    });

    it('should not allow receipient2 to be null', () => {
    });

    it('should not allow zero split amounts', () => {
    });

    it('should split to the two receipients', () => {
    });

    it('should send the remainder amounts to the sender', () => {
    });


    // Withdraw checks
    it('should not allow withdraw on a paused contract', () => {
    });

    it('should not allow withdraw on a killed contract', () => {
    });

    it('should not allow zero withdrawal', () => {
    });

    it('should not allow over withdrawal', () => {
    });

    it('should not allow reentrancy from an attacker', () => {
    });
    

});