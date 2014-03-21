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
            
            keySearch: function(serverId, dbId, pattern, page) {
                return $http.get(
                    config.apiUri + 'server/' + serverId + '/db/' + dbId + '/search', 
                    {
                        params : {
                            pattern : pattern,
                            // backend pagination starts from 0, frontend from 1
                            page: page > 0 ? page-1 : 0
                        },
                        cache: keySearchCache
                    }
                );
            }
        };
        
        return service;
    }
]);
