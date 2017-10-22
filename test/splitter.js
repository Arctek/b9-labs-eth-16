'use strict';
const assertInvalidOpcode = require('../test_util/assertInvalidOpcode');

var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {
    var contract;

    const evenContribution = 2200;
    const oddContribution  = 2201;

    const owner   = accounts[0];
    const bob     = accounts[1];
    const carol   = accounts[2];

    beforeEach(function() {
        return Splitter.new({ from: owner }).then(instance => contract = instance);
    });

    // Split checks
    it('should not allow split on a paused contract', () => {
            return contract.setPaused(true, { from: owner }
        )
        .then( async function() {
            try {
                await contract.split(bob, carol, {from: owner, value: evenContribution});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });
   
    it('should not allow split on a killed contract', () => {
            return contract.kill({ from: owner }
        )
        .then( async function() {
            try {
                await contract.split(bob, carol, {from: owner, value: evenContribution});
                assert.fail('should have failed');
            } catch(error) {
                assertInvalidOpcode(error);
            }
        })
        .catch(err => {
            assert.fail(err)
        });
    });

    it('should not allow receipient1 to be null', async function() {
        try {
            await contract.split(null, carol, {from: owner, value: evenContribution});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow receipient2 to be null', async function() {
        try {
            await contract.split(bob, null, {from: owner, value: evenContribution});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow receipient1 to be the same as receipient2', async function() {
        try {
            await contract.split(bob, bob, {from: owner, value: evenContribution});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should not allow zero split amounts', async function() {
        try {
            await contract.split(bob, carol, {from: owner, value: 0});
            assert.fail('should have failed');
        } catch(error) {
            assertInvalidOpcode(error);
        }
    });

    it('should split to the two receipients', async function() {
        let splitTx = await contract.split(bob, carol, {from: owner, value: evenContribution} );

        let bobBalance = await contract.recipientBalances.call(bob);

        assert.isAbove(bobBalance.toNumber(), 0, "the funds were not split");

        let carolBalance = await contract.recipientBalances.call(bob);

        assert.isAbove(carolBalance.toNumber(), 0, "the funds were not split");        
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