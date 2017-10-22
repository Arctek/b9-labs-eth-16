'use strict';
const assertInvalidOpcode = require('../test_util/assertInvalidOpcode');

var Pauseable = artifacts.require("./Pauseable.sol");

contract('Pauseable', function(accounts) {
    var contract;

    const owner   = accounts[0];
    const bob     = accounts[1];

    beforeEach(function() {
        return Pauseable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to pause', async function() {
        try {
            await contract.setPaused(true, {from: bob});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should allow owner to pause', () => {
            return contract.setPaused(true, { from: owner }
        ).then(() => {
            return contract.paused();
        })
        .then(newPaused => {
            assert.strictEqual(newPaused, true, "paused was not changed")
        })
        .catch(err => {
            assert.fail(err)
        });
    });
});