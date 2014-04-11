App.controller('SearchController', ['$scope', '$routeParams', '$location', 'RedisService',
    function ($scope, $routeParams, $location, RedisService) {
        console.log('SearchController');
        console.log($routeParams);
        
        $scope.search = {
            pattern: '',
            page: 1, 
            pageCount: 0,
            sort: {
                field: 'name',
                reverse: false
            },
            result: {
                pattern: '',
                selected: [],
                keys: [],
                total: 0,
                pageSize: 1
            }        
        };        
        
        $scope.submitSearch = function() {
			if ($scope.searchForm.$valid) {
                $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern), false);
                $scope.searchKey($scope.search.pattern, 1);
			}            
        }
        
        $scope.searchKey = function(pattern, page) {
            console.log('searchKey: ' + page + '[' + $scope.search.page + ']');
            $scope.search.pattern = pattern;
                        
            return RedisService.searchKeys($scope.current.serverId, $scope.current.dbId, pattern, page).then(
                function(response) {
                    /*
                     * because pagination plugin watches total count and page,
                     * these variables should be changed in one scope
                     */
                    $scope.search.page = page;
                    $scope.search.result.pattern = pattern;
                    $scope.search.result.total = response.data.metadata.total;
                    $scope.search.result.pageSize = response.data.metadata.page_size;
                                        
                    $scope.search.result.keys = [];
                    angular.forEach(response.data.items, function(value){
                        $scope.search.result.keys.push(value);
                    });

                    console.log('searchKey / done');
                }
            );
        }
        
        $scope.selectKeyExclusive = function(key) {
            console.log('keySelect: ' + key);
       
            for (var i=0; i<$scope.search.result.keys.length; i++) {
                if ($scope.search.result.keys[i].name == key) {
                    // if multiple keys are selected - then select current key
                    // if only one key was selected - then inverse current state
                    // (i.e. allow to unselect current key) 
                    $scope.search.result.keys[i].selected = $scope.search.result.selected.length == 1 ? !$scope.search.result.keys[i].selected : true;
                }
                else {
                    $scope.search.result.keys[i].selected = false;
                }
            }
        }
        
        $scope.deleteKeys = function() {
            console.log('deleteSelectedKeys');
            var deleteKeys = $scope.search.result.selected;
            if (deleteKeys) {
                $scope.$parent.showModalConfirm({
                    title: 'Delete key(s) forever?',
                    message: (deleteKeys.length == 1 ? '1 key is' : deleteKeys.length + ' keys are') + ' about to be permanently deleted:',
                    items: deleteKeys,
                    warning: 'You can\'t undo this action!',
                    action: 'Delete'
                }).result.then(function() {
                    RedisService.deleteKeys($scope.current.serverId, $scope.current.dbId, deleteKeys).then(
                        function(response) {
                            console.log(response);
                            // remove deleted keys from scope
                            for (var i = $scope.search.result.keys.length - 1; i >= 0; i--) {
                                if (deleteKeys.indexOf($scope.search.result.keys[i].name) >= 0) {
                                    $scope.search.result.keys.splice(i, 1);
                                }
                            }
                            // reduce amount of keys in search reault and whole db
                            $scope.search.result.total -= response.data.result;
                            $scope.$parent.getCurrentDB().keys -= response.data.result;

                            console.log('deleteSelectedKeys / done');
                        }
                    );
                });
            }
        }
        
        $scope.editKeyTtl = function() {
            console.log('changeKeyTtl');
            var key = $scope.search.result.selected[0];
            var ttl = 0;
            
            if (key) {
                for (var i = 0; i < $scope.search.result.keys.length; i++) {
                    if ($scope.search.result.keys[i].name == key) {
                        ttl = $scope.search.result.keys[i].ttl;
                        break;
                    }
                }
                
                $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyttl.html',                  
                    {
                        value: ttl < 0 ? 0 : ttl,
                        key: key
                    }
                ).result.then(function(newTtl) {
                    RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, key, {ttl: newTtl}).then(
                        function(response) {
                            // update key ttl in scope
                            for (var i = $scope.search.result.keys.length - 1; i >= 0; i--) {
                                if ($scope.search.result.keys[i].name == key) {
                                    $scope.search.result.keys[i].ttl = newTtl;
                                    break;
                                }
                            }

                            console.log('changeKeyTtl / done');
                        }
                    );
                });
            }
        }  
        
        $scope.editKeyName = function() {
            console.log('editKeyName');
            var key = $scope.search.result.selected[0];
            
            if (key) {
                $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyname.html',                 
                    {
                        value: key,
                        key: key
                    }
                ).result.then(function(newName) {
                    if (newName != key) {
                        RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, key, {name: newName}).then(
                            function(response) {
                                if (response.data.result.name) {
                                    // update key name in scope
                                    for (var i = $scope.search.result.keys.length - 1; i >= 0; i--) {
                                        if ($scope.search.result.keys[i].name == key) {
                                            $scope.search.result.keys[i].name = newName;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    $scope.$parent.showModalAlert({
                                        data: {
                                            title: 'Rename error!',
                                            message: 'Could not rename key "' + key + '" to "' + newName + '"'
                                        }
                                    });
                                }

                                console.log('editKeyName / done');
                            }
                        );
                    }
                });
            }
        }  
        
        $scope.moveKeys = function() {
            $scope.$parent.showModalAlert({title: 'Error', message: 'This function is not implemented yet!'});
        }
        
        $scope.getKeyUri = function(key) {
            return encodeURI('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/' + encodeURIComponent(key));
        }
        
        $scope.openKey = function() {
            var key = $scope.search.result.selected[0];
            if (key) {
                $location.path($scope.getKeyUri(key));
            }
        }
        
        $scope.setPage = function(page) {
            console.log('set page: ' + page + '[' + $scope.search.page + ']');
            console.log($scope.search);
            $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern) + '/' + encodeURIComponent(page), false);
            $scope.searchKey($scope.search.pattern, page);
        };
        
        $scope.$watch('search.result.keys', function(){
            $scope.search.result.selected = [];
            for (var i = 0; i < $scope.search.result.keys.length; i++) {
                if ($scope.search.result.keys[i].selected) {
                    $scope.search.result.selected.push($scope.search.result.keys[i].name);
                }
            }
        }, true);
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $scope.$parent.view = {
                title: 'Database',
                subtitle: $scope.getCurrentDB().name
            };
            
            if ($routeParams.pattern) {
                console.log('search');
                console.log($routeParams);
                var page = parseInt($routeParams.page, 10) > 0 ? parseInt($routeParams.page, 10) : 1;
                $scope.searchKey($routeParams.pattern, page);
            }
        });        
    }
]);
