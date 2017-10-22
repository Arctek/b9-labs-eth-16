'use strict';
const assertInvalidOpcode = require('../test_util/assertInvalidOpcode');

var Killable = artifacts.require("./Killable.sol");

contract('Killable', function(accounts) {
    var contract;

    const owner   = accounts[0];
    const bob     = accounts[1];

    beforeEach(function() {
        return Killable.new({ from: owner }).then(instance => contract = instance);
    });

    it('should not allow non-owner to kill the contract', async function() {
        try {
            await contract.kill({from: bob});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should allow owner to kill the contract', () => {
            return contract.kill({ from: owner }
        ).then(() => {
            return contract.killed();
        })
        .then(newKilled => {
            assert.strictEqual(newKilled, true, "the contract was not killed")
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow the owner to emergency withdraw on a unkilled contract', async function() {
        try {
            await contract.emergencyWithdrawal({from: owner});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow non-owner to emergency withdraw a killed contract', () => {
            return contract.kill({ from: owner }
        )
        .then( async function() {
            try {
                await contract.emergencyWithdrawal({from: bob});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should allow owner to emergency withdraw a killed contract', () => {
            return contract.kill({ from: owner }
        ).then(() => {
            return contract.emergencyWithdrawal.call({ from: owner });
        })
        .then(success => {
            assert.strictEqual(success, true, "the owner could not emergency withdraw")
        })
        .catch(err => {
            assert.fail(err)
        });
    });


});