App.factory('RedisService', ['$http', '$angularCacheFactory', 'config',
    function ($http, cacheFactory, config) {
        "use strict";

        /**
         * @constructor
         * @param {Array} config
         * @param {Boolean} config.cache
         * @param {String} config.apiUri
         */
        function RedisAPI(config) {

            /**
             * @type {String}
             */
            var apiUri = config.apiUri;

            /**
             * @param {String} name
             * @param {Boolean} enabled
             * @returns {Boolean|AngularCache}
             */
            var cacheCreate = function (name, enabled) {
                if (enabled) {
                    return cacheFactory(name,
                        {
                            maxAge: 10 * 60 * 1000,
                            deleteOnExpire: 'passive'
                        }
                    );
                } else {
                    return false;
                }
            };

            /**
             * @param {AngularCache} cache
             */
            var cacheClear = function (cache) {
                if (angular.isObject(cache)) {
                    cache.removeAll();
                }
            };

            /**
             * @type {Boolean|AngularCache}
             */
            var cacheServer = cacheCreate('RedisAPI.Server', config.cache);

            /**
             * @type {Boolean|AngularCache}
             */
            var cacheKeys = cacheCreate('RedisAPI.Keys', config.cache);

            /**
             * @returns {HttpPromise}
             */
            this.getServers = function () {
                return $http.get(apiUri + 'server/list',
                    {
                        cache: cacheServer
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @returns {HttpPromise}
             */
            this.getServerDBs = function (serverId) {
                return $http.get(apiUri + 'server/' + serverId + '/databases',
                    {
                        cache: cacheServer
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @returns {HttpPromise}
             */
            this.getServerInfo = function (serverId) {
                return $http.get(apiUri + 'server/' + serverId + '/info',
                    {
                        cache: cacheServer
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @returns {HttpPromise}
             */
            this.getServerConfig = function (serverId) {
                return $http.get(apiUri + 'server/' + serverId + '/config',
                    {
                        cache: cacheServer
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Boolean} nocache
             * @returns {HttpPromise}
             */
            this.getServerClients = function (serverId, nocache) {
                return $http.get(apiUri + 'server/' + serverId + '/clients',
                    {
                        cache: nocache ? false : cacheServer
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Object} clients
             * @returns {HttpPromise}
             */
            this.killServerClients = function (serverId, clients) {
                return $http.post(apiUri + 'server/' + serverId + '/clients/kill',
                    {
                        clients: clients
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @returns {HttpPromise}
             */
            this.flushDB = function (serverId, dbId) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/flush'
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {String} pattern
             * @param {Number} page
             * @returns {HttpPromise}
             */
            this.searchKeys = function (serverId, dbId, pattern, page) {
                // backend pagination starts from 0, frontend from 1
                page = page > 0 ? page - 1 : 0;

                return $http.get(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/search',
                    {
                        params: {
                            pattern: pattern,
                            page: page
                        },
                        cache: cacheKeys
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {Object} key
             * @returns {HttpPromise}
             */
            this.viewKey = function (serverId, dbId, key) {
                return $http.get(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/view',
                    {
                        params: {
                            key: key
                        },
                        cache: cacheKeys
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {Object} key
             * @returns {HttpPromise}
             */
            this.createKey = function (serverId, dbId, key) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/create', key
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {Array} keys
             * @returns {HttpPromise}
             */
            this.deleteKeys = function (serverId, dbId, keys) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/delete',
                    {
                        keys: keys
                    }
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {Array} keys
             * @param {Number} newDbId
             * @returns {HttpPromise}
             */
            this.moveKeys = function (serverId, dbId, keys, newDbId) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/move',
                    {
                        keys: keys,
                        db: newDbId
                    }
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {String} keyName
             * @param {String} newName
             * @returns {HttpPromise}
             */
            this.renameKey = function (serverId, dbId, keyName, newName) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/rename',
                    {
                        name: keyName,
                        value: {
                            name: newName
                        }
                    }
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {String} keyName
             * @param {Number} ttl
             * @returns {HttpPromise}
             */
            this.expireKey = function (serverId, dbId, keyName, ttl) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/expire',
                    {
                        name: keyName,
                        ttl: ttl
                    }
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {Object} key
             * @returns {HttpPromise}
             */
            this.updateKeyValues = function (serverId, dbId, key) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/values/update', key
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };

            /**
             * @param {Number} serverId
             * @param {Number} dbId
             * @param {Object} key
             * @returns {HttpPromise}
             */
            this.deleteKeyValues = function (serverId, dbId, key) {
                return $http.post(apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/values/delete', key
                ).then(
                    function (response) {
                        cacheClear(cacheKeys);
                        return response;
                    }
                );
            };
        }

        return new RedisAPI(config);
    }
]);
