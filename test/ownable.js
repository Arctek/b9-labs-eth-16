'use strict';
const assertInvalidOpcode = require('../test_util/assertInvalidOpcode');

var Ownable = artifacts.require("./Ownable.sol");

contract('Ownable', function(accounts) {
    var contract;

    const owner   = accounts[0];
    const bob     = accounts[1];

    beforeEach(function() {
        return Ownable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to set owner', async function() {
        try {
            await contract.setOwner(bob, {from: bob});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should allow owner to set owner', () => {
        return contract.setOwner(bob, { from: owner }
        ).then(() => {
            return contract.owner();
        })
        .then(newOwner => {
            assert.strictEqual(newOwner, bob, "the owner was not changed")
        })
        .catch(err => {
            assert.fail(err)
        });
    });

});