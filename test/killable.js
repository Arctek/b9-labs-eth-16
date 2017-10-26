'use strict';

const Killable = artifacts.require("./Killable.sol");
const UnsafeKillable = artifacts.require("./UnsafeKillable.sol");

import { default as Promise } from 'bluebird';

if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

const ethJsUtil = require('../node_modules/ethereumjs-util/');

web3.eth.getTransactionReceiptMined = require("../test_util/getTransactionReceiptMined.js");
web3.eth.expectedPayableExceptionPromise = require("../test_util/expectedPayableExceptionPromise.js");
web3.eth.expectedExceptionPromise = require("../test_util/expectedExceptionPromise.js");
web3.eth.makeSureAreUnlocked = require("../test_util/makeSureAreUnlocked.js");
web3.eth.makeSureHasAtLeast = require("../test_util/makeSureHasAtLeast.js");
assert.topicContainsAddress = require("../test_util/topicContainsAddress.js");

contract('Killable', accounts => {
    const gasToUse = 3000000;
    const contractBalance = new web3.BigNumber((Math.floor(Math.random() * 100000) + 1) * 2);
    let owner, bob;

    let zeroBigNumber = new web3.BigNumber(0);

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        bob = accounts[1];

        return web3.eth.makeSureAreUnlocked([owner, bob])
            .then(() => web3.eth.makeSureHasAtLeast(owner, [bob, owner], web3.toWei(2)))
            .then(txObject => web3.eth.getTransactionReceiptMined(txObject));
    });

    describe("Contract and kill actions", () => {
        beforeEach(() => {
            return Killable.new({ from: owner }).then(instance => contract = instance);
        });

        it('should be initialized as unkilled', () => {
            return contract.killed().then(isKilled => { assert.isFalse(isKilled, "should not be killed"); });
        });

        it('should not allow owner to kill an unpaused contract', () => {
            return web3.eth.expectedExceptionPromise(() => {
                return contract.kill({ from: owner, gas: gasToUse });
            }, gasToUse);
        });

        describe("Paused contract", () => {
            beforeEach("should pause the contract", () => {
                return contract.setPaused(true, { from: owner });
            });

            it('should not allow non-owner to kill the contract', () => {
                return web3.eth.expectedExceptionPromise(() => {
                    return contract.kill({ from: bob, gas: gasToUse });
                }, gasToUse);
            });

            it('should not allow the owner to emergency withdraw on a unkilled contract', () => {
                return web3.eth.expectedExceptionPromise(() => {
                    return contract.emergencyWithdrawal({ from: owner, gas: gasToUse });
                }, gasToUse);
            });

            it('should allow owner to kill the contract', () => {
                    return contract.kill({ from: owner }
                ).then(txObject => {
                    assertEventLogKill(txObject, owner);

                    return contract.killed()
                }).then(newKilled => {
                    assert.isTrue(newKilled, "the contract was not killed");
                });
            });
        });
    });

    describe("Withdraw actions", () => {
        beforeEach("should create an UnsafeKillable contract", () => {
            return UnsafeKillable.new({ from: owner }).then(instance => contract = instance);
        });

        beforeEach("should send some funds to the unsafe contract", () => {
            return web3.eth.sendTransactionPromise({ from: owner, to: contract.address, value: contractBalance});
        });

        beforeEach("should pause the contract", () => {
            return contract.setPaused(true, { from: owner });
        });

        beforeEach("should kill the contract", () => {
            return contract.kill({ from: owner })
                .then(txObject => { assertEventLogKill(txObject, owner); });
        });

        it('should not allow non-owner to emergency withdraw a killed contract', () => {
            return web3.eth.expectedExceptionPromise(() => {
                return contract.emergencyWithdrawal({ from: bob, gas: gasToUse });
            }, gasToUse);
        });

        it('should allow owner to emergency withdraw a killed contract', () => {
                let ownerAccountBalance;
                let contractInitialBalance;
                let gasCost;
                let gasUsed;
                let gasPrice;

                return web3.eth.getBalancePromise(owner)
            .then(accountBalance => {
                ownerAccountBalance = accountBalance;

                return web3.eth.getBalancePromise(contract.address);
            }).then(contractBalance => {
                contractInitialBalance = contractBalance;

                return contract.emergencyWithdrawal({ from: owner });
            })
            .then(txObject => {
                gasUsed = txObject.receipt.gasUsed;

                assertEventLogEmergencyWithdrawal(txObject, owner);

                return web3.eth.getTransaction(txObject.tx);
            })
            .then(tx => {
                gasPrice = tx.gasPrice;
                gasCost = tx.gasPrice.times(gasUsed);

                return web3.eth.getBalancePromise(owner);
            })
            .then(accountBalance => {
                let expectedAccountBalance = ownerAccountBalance.plus(contractInitialBalance).minus(gasCost);
                
                assert.deepEqual(expectedAccountBalance, accountBalance, "the emergency withdrawn amount was incorrect");

                return web3.eth.getBalancePromise(contract.address);
            })
            .then(contractBalance => {
                assert.deepEqual(contractBalance, zeroBigNumber, "contract balance should be zero");

                return contract.isWithdrawn();
            })
            .then(isWithdrawn => {
                assert.isTrue(isWithdrawn, "the is withdrawn state was not set correclty");
            });
        });

        it('should not allow owner to emergency withdraw twice', () => {
            return contract.emergencyWithdrawal({ from: owner }
            )
            .then(txObject => {
                assertEventLogEmergencyWithdrawal(txObject, owner);
                
                return web3.eth.expectedExceptionPromise(() => {
                    return contract.emergencyWithdrawal({ from: owner, gas: gasToUse });
                }, gasToUse);
            });
        });

    });

});

function assertEventLogKill(txObject, who) {
    assert.equal(txObject.logs.length, 1, "should have received 1 event");
    assert.strictEqual(txObject.logs[0].event, "LogKill", "should have received LogKill event");
                
    assert.strictEqual(
        txObject.logs[0].args.who,
        who,
        "should be the owner");
    
    assert.strictEqual(txObject.receipt.logs[0].topics.length, 2, "should have 2 topics");

    assert.topicContainsAddress(txObject.receipt.logs[0].topics[1], who);
}

function assertEventLogEmergencyWithdrawal(txObject, who) {
    assert.equal(txObject.logs.length, 1, "should have received 1 event");
    assert.strictEqual(txObject.logs[0].event, "LogEmergencyWithdrawal", "should have received LogEmergencyWithdrawal event");
                
    assert.strictEqual(
        txObject.logs[0].args.who,
        who,
        "should be the owner");
    
    assert.strictEqual(txObject.receipt.logs[0].topics.length, 2, "should have 2 topics");

    assert.topicContainsAddress(txObject.receipt.logs[0].topics[1], who);
}