App.factory('RedisService', ['$http', '$angularCacheFactory', 'config', 
    function($http, cacheFactory, config) {
        if (config.cache) {
            var keySearchCache = cacheFactory('keySearchCache', 
                { 
                    maxAge: 10 * 60 * 1000,
                    deleteOnExpire: 'passive'
                }
            );
        }
        else {
            var keySearchCache = false;
        }
        
        var service = {
            
            /**
             * Server API calls
             */
            
            getServers: function() {
                return $http.get(
                    config.apiUri + 'server/list',
                    {
                        cache: config.cache
                    }
                );
            },

            getDBs: function(serverId) {
                return $http.get(
                    config.apiUri + 'server/' + serverId + '/databases',
                    {
                        cache: config.cache
                    }
                );
            },
            
            getInfo: function(serverId) {
                return $http.get(
                    config.apiUri + 'server/' + serverId + '/info', 
                    {
                        cache: config.cache
                    }
                );
            },
            
            getClients: function(serverId, nocache) {
                return $http.get(
                    config.apiUri + 'server/' + serverId + '/clients', 
                    {
                        cache: nocache ? false : config.cache
                    }
                );
            },
            
            /**
             * keys API calls
             */
            
            searchKeys: function(serverId, dbId, pattern, page) {
                return $http.get(
                    config.apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/search', 
                    {
                        params : {
                            pattern : pattern,
                            // backend pagination starts from 0, frontend from 1
                            page: page > 0 ? page-1 : 0
                        },
                        cache: keySearchCache
                    }
                );
            },
            
            deleteKeys: function(serverId, dbId, keys) {
                return $http.post(
                    config.apiUri + 'server/' + serverId + '/db/' + dbId + '/keys/delete', 
                    {
                        keys : keys
                    }
                ).then(function(response) {
                    if (angular.isObject(keySearchCache)) {
                        console.log('clear cache after delete');
                        keySearchCache.removeAll();
                    }
                    
                    return response;
                });
            }                    
            
        };
        
        return service;
    }
]);
