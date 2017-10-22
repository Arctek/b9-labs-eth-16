var Ownable = artifacts.require("./Ownable.sol");

contract('Ownable', function(accounts) {
    var contract;

    var owner   = accounts[0];
    var bob     = accounts[1];

    beforeEach(function() {
        return Ownable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to set owner', () => {
    });

    it('should allow owner to set owner', () => {
    });


});