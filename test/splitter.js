'use strict';

const Splitter = artifacts.require("./Splitter.sol");

import { default as Promise } from 'bluebird';


if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

web3.eth.getTransactionReceiptMined = require("../test_util/getTransactionReceiptMined.js");
web3.eth.expectedPayableExceptionPromise = require("../test_util/expectedPayableExceptionPromise.js");
web3.eth.expectedExceptionPromise = require("../test_util/expectedExceptionPromise.js");
web3.eth.makeSureAreUnlocked = require("../test_util/makeSureAreUnlocked.js");
web3.eth.makeSureHasAtLeast = require("../test_util/makeSureHasAtLeast.js");
web3.eth.calculateGasCost = require("../test_util/calculateGasCost.js");
assert.topicContainsAddress = require("../test_util/topicContainsAddress.js");

contract('Splitter', accounts => {
    const gasToUse = 3000000;

    const evenContribution = new web3.BigNumber((Math.floor(Math.random() * 100000) + 1) * 2);
    const oddContribution  = evenContribution.plus(1);

    let owner, bob, carol;

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        bob   = accounts[1];
        carol = accounts[2];

        return web3.eth.makeSureAreUnlocked([owner, bob, carol])
            .then(() => web3.eth.makeSureHasAtLeast(owner, [bob, carol], evenContribution.times(10)))
            .then(txObject => web3.eth.getTransactionReceiptMined(txObject));
    });
    
    beforeEach(() => {
        return Splitter.new({ from: owner }).then(instance => contract = instance);
    });

    // Split checks
    it('should not allow split on a paused contract', async () => {
        await contract.setPaused(true, { from: owner });
        
        await web3.eth.expectedExceptionPromise(() => 
            contract.split(bob, carol, { from: owner, gas: gasToUse, value: evenContribution }), gasToUse);
    });
   
    it('should not allow split on a killed contract', async () => {
        await contract.setPaused(true, { from: owner });
        await contract.kill({ from: owner });

        await web3.eth.expectedExceptionPromise(() => 
            contract.split(bob, carol, { from: owner, gas: gasToUse, value: evenContribution }), gasToUse);
    });

    it('should not allow recipient1 to be null', () => {
        return web3.eth.expectedExceptionPromise(() => {
            return contract.split(null, carol, { from: owner, gas: gasToUse, value: evenContribution });
        }, gasToUse);
    });

    it('should not allow recipient2 to be null', () => {
        return web3.eth.expectedExceptionPromise(() =>
            contract.split(bob, null, { from: owner, gas: gasToUse, value: evenContribution }),
        gasToUse);
    });

    it('should not allow recipient1 to be the same as recipient2', () => {
        return web3.eth.expectedExceptionPromise(() => 
            contract.split(bob, bob, { from: owner, gas: gasToUse, value: evenContribution }),
        gasToUse);
    });

    it('should not allow zero split amounts', () => {
        return web3.eth.expectedExceptionPromise(() =>
            contract.split(bob, carol, { from: owner, gas: gasToUse, value: 0 }),
        gasToUse);
    });

    it('should split to the two recipients', async () => {
        let txObject = await contract.split(bob, carol, { from: owner, value: evenContribution });
        let bobBalance = await contract.recipientBalances.call(bob);
        let carolBalance = await contract.recipientBalances.call(carol);

        assertEventLogSplit(txObject, owner, bob, carol, evenContribution);
        
        assert.deepEqual(bobBalance, evenContribution.dividedBy(2), "the funds were not split for bob");
        assert.deepEqual(carolBalance, evenContribution.dividedBy(2), "the funds were not split for carol");
    });

    it('should attribute the remainder amount to the sender', async () => {
        let quotientContribution = oddContribution.minus(1);
        let halfContribution = quotientContribution.dividedBy(2);

        let txObject = await contract.split(bob, carol, { from: owner, value: oddContribution });
        let bobBalance = await contract.recipientBalances.call(bob);
        let carolBalance = await contract.recipientBalances.call(carol);
        let ownerBalance = await contract.recipientBalances.call(owner);

        assertEventLogSplit(txObject, owner, bob, carol, oddContribution);
        
        assert.deepEqual(bobBalance, halfContribution, "the funds were not split for bob");
        assert.deepEqual(carolBalance, halfContribution, "the funds were not split for carol");
        
        assert.deepEqual(ownerBalance, new web3.BigNumber(1), "the sender was not attributed the remainder")
    });

    // Withdraw checks upon having split
    describe("Receipients have a split balance", () => {
        beforeEach(() => {
            return contract.split(bob, carol, { from: owner, value: evenContribution })
                .then(txObject => { assertEventLogSplit(txObject, owner, bob, carol, evenContribution); });
        });

        it('should not allow withdraw on a paused contract', async () => {
            await contract.setPaused(true, { from: owner });
            
            await web3.eth.expectedExceptionPromise(() =>
                contract.withdraw({ from: bob, gas: gasToUse }), gasToUse);
        });

        it('should not allow withdraw on a killed contract', async () => {
            await contract.setPaused(true, { from: owner });
            await contract.kill({ from: owner });

            await web3.eth.expectedExceptionPromise(() => 
                contract.withdraw({ from: bob, gas: gasToUse }), gasToUse);
        });

        it('should allow a withdrawal', async () => {
            let bobAccountBalance = await web3.eth.getBalancePromise(bob);
            let bobContractBalance = await contract.recipientBalances.call(bob);

            let txObject = await contract.withdraw({ from: bob });
            let tx = await web3.eth.getTransaction(txObject.tx);

            let newBobAccountBalance = await web3.eth.getBalancePromise(bob);
            let newBobContractBalance = await contract.recipientBalances.call(bob);

            let gasCost = web3.eth.calculateGasCost(txObject, tx);
            let expectedAccountBalance = bobAccountBalance.plus(bobContractBalance).minus(gasCost);

            assertEventLogWithdraw(txObject, bob, bobContractBalance);  

            assert.deepEqual(expectedAccountBalance, newBobAccountBalance, "the withdrawn amount was incorrect");
            assert.deepEqual(newBobContractBalance, new web3.BigNumber(0), "contract balance should be zero");
        });

        it('should not allow a double withdrawal', async () => {
            let bobContractBalance = await contract.recipientBalances.call(bob);

            let txObject = await contract.withdraw({ from: bob });
            
            assertEventLogWithdraw(txObject, bob, bobContractBalance);

            await web3.eth.expectedExceptionPromise(() =>
                    contract.withdraw({ from: bob, gas: gasToUse }), gasToUse);
        });
    });
});

function assertEventLogSplit(txObject, sender, recipient1, recipient2, splitAmount) {
    assert.strictEqual(txObject.logs.length, 1, "should have received 1 event");
    assert.strictEqual(txObject.logs[0].event, "LogSplit", "should have received LogSplit event");

    assert.strictEqual(
        txObject.logs[0].args.sender,
        sender,
        "should be sender");
    assert.strictEqual(
        txObject.logs[0].args.recipient1,
        recipient1,
        "should be recipient1");
    assert.strictEqual(
        txObject.logs[0].args.recipient2,
        recipient2,
        "should be recipient2");
    assert.deepEqual(
        txObject.logs[0].args.splitAmount,
        splitAmount,
        "should be split amount");

    assert.strictEqual(txObject.receipt.logs[0].topics.length, 4, "should have 4 topics");

    assert.topicContainsAddress(txObject.receipt.logs[0].topics[1], sender);
    assert.topicContainsAddress(txObject.receipt.logs[0].topics[2], recipient1);
    assert.topicContainsAddress(txObject.receipt.logs[0].topics[3], recipient2);
}

function assertEventLogWithdraw(txObject, recipient, withdrawAmount) {
    assert.strictEqual(txObject.logs.length, 1, "should have received 1 event");
    assert.strictEqual(txObject.logs[0].event, "LogWithdraw", "should have received LogWithdraw event");

    assert.strictEqual(
        txObject.logs[0].args.recipient,
        recipient,
        "should be recipient");
    assert.deepEqual(
        txObject.logs[0].args.withdrawAmount,
        withdrawAmount,
        "should be expected withdraw amount");
    
    assert.strictEqual(txObject.receipt.logs[0].topics.length, 2, "should have 2 topics");

    assert.topicContainsAddress(txObject.receipt.logs[0].topics[1], recipient);
}