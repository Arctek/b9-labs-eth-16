var Killable = artifacts.require("./Killable.sol");

contract('Killable', function(accounts) {
    var contract;

    var owner   = accounts[0];
    var bob     = accounts[1];

    beforeEach(function() {
        return Killable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to kill the contract', () => {
    });

    it('should allow owner to kill the contract', () => {
    });

    it('should not allow the owner to emergency withdraw on a unkilled contract', () => {
    });

    it('should not allow non-owner to emergency withdraw', () => {
    });

    it('should allow owner to emergency withdraw', () => {
    });


});