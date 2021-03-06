var assert = require('assert');
var mubsub = require('../lib/index');
var data = require('./fixtures/data');
var helpers = require('./helpers');

describe('Channel', function () {
    beforeEach(function () {
        this.client = mubsub(helpers.uri);
        this.channel = this.client.channel('channel');
    });

    it('unsubscribes properly', function (done) {
        var subscription = this.channel.subscribe('a', function (data) {
            assert.equal(data, 'a');
            subscription.unsubscribe();
            done();
        });

        this.channel.publish('a', 'a');
        this.channel.publish('a', 'a');
        this.channel.publish('a', 'a');
    });

    it('unsubscribes if channel is closed', function (done) {
        var self = this;

        var subscription = this.channel.subscribe('a', function (data) {
            assert.equal(data, 'a');
            self.channel.close();
            done();
        });

        this.channel.publish('a', 'a');
        this.channel.publish('a', 'a');
        this.channel.publish('a', 'a');
    });

    it('unsubscribes if client is closed', function (done) {
        var self = this;

        var subscription = this.channel.subscribe('a', function (data) {
            assert.equal(data, 'a');
            self.client.close();
            done();
        });

        this.channel.publish('a', 'a');
        this.channel.publish('a', 'a');
        this.channel.publish('a', 'a');
    });

    it('can subscribe and publish different events', function (done) {
        var todo = 3;
        var subscriptions = [];

        function complete() {
            todo--;

            if (!todo) {
                subscriptions.forEach(function (subscriptions) {
                    subscriptions.unsubscribe();
                });

                done();
            }
        }

        subscriptions.push(this.channel.subscribe('a', function (data) {
            assert.equal(data, 'a');
            complete();
        }));

        subscriptions.push(this.channel.subscribe('b', function (data) {
            assert.deepEqual(data, {b: 1});
            complete();
        }));

        subscriptions.push(this.channel.subscribe('c', function (data) {
            assert.deepEqual(data, ['c']);
            complete();
        }));

        this.channel.publish('a', 'a');
        this.channel.publish('b', { b: 1 });
        this.channel.publish('c', ['c']);
    });

    it('gets lots of subscribed data fast enough', function (done) {
        var channel = this.client.channel('channel.bench', { size: 1024 * 1024 * 100 });
        
        var n = 5000;
        var count = 0;

        var subscription = channel.subscribe('a', function (_data) {
            assert.deepEqual(_data, data);

            if (++count == n) {
                subscription.unsubscribe();
                done();
            }
        });

        for (var i = 0; i < n; i++) {
            channel.publish('a', data);
        }
    });
});
