var Pauseable = artifacts.require("./Pauseable.sol");

contract('Pauseable', function(accounts) {
    var contract;

    var owner   = accounts[0];
    var bob     = accounts[1];

    beforeEach(function() {
        return Pauseable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to pause', () => {
    });

    it('should allow owner to pause', () => {
    });

});