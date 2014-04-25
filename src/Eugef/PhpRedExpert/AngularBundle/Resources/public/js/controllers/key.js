App.controller('KeyController', ['$scope', '$routeParams', '$location', 'RedisService',
    function ($scope, $routeParams, $location, RedisService) {
        console.log('KeyController');
        console.log($routeParams);

        $scope.key = {};
        $scope.alerts = [];
        
        $scope.addKey = function(keyType) {
            console.log('addKey');
            $scope.key = {
                new: true,
                type: keyType,
                ttl: 0
            }
            
            switch (keyType) {
                case 'string':
                    $scope.key.value = '';
                    break;
                case 'hash':
                    $scope.key.value = {};
                    break;
            }
        }

        $scope.editKey = function(keyName) {
            console.log('editKey');
            $scope.key = {
                name: keyName
            };
            return RedisService.viewKey($scope.current.serverId, $scope.current.dbId, keyName).then(
                function(response) {
                    $scope.key = response.data.key;
                    $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl; 
                    console.log($scope.key)
                    console.log('// editKey');
                }
            );    
        }
        
        $scope.submitKey = function() {
            if ($scope.key.new) {
                console.log('submitKey: add');
                return RedisService.addKey($scope.current.serverId, $scope.current.dbId, $scope.key).then(
                    function(response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + encodeURIComponent($scope.key.name), false);
                        $scope.alerts.push({type: 'success', message: 'Key is succesfully created'});
                        console.log('// submitKey / add');
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not created'});
                        console.log('// submitKey / add /error');
                    }
                );
            }
            else {
                console.log('submitKey: edit');
                return RedisService.editKey($scope.current.serverId, $scope.current.dbId, $scope.key).then(
                    function(response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $scope.alerts.push({type: 'success', message: 'Key is succesfully updated'});
                        console.log('// submitKey / edit');
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not updated'});
                        console.log('// submitKey / edit /error');
                    }
                );
            }
        }
        
        $scope.editKeyTtl = function() {
            console.log('editKeyTtl');
                
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyttl.html',                  
                {
                    value: $scope.key.ttl,
                    key: $scope.key.name
                }
            ).result.then(function(newTtl) {
                RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {ttl: newTtl}).then(
                    function(response) {
                        $scope.key.ttl = newTtl;
                        console.log('editKeyTtl / done');
                    }
                );
            });
            
        }  
        
        $scope.editKeyName = function() {
            console.log('editKeyName');
            
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyname.html',                 
                {
                    value: $scope.key.name,
                    key: $scope.key.name
                }
            ).result.then(function(newName) {
                if (newName != $scope.key.name) {
                    RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {name: newName}).then(
                        function(response) {
                            if (response.data.result.name) {
                                $scope.key.name = newName;
                                // update key name in url
                                $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + encodeURIComponent($scope.key.name), false);
                            }
                            else {
                                $scope.$parent.showModalAlert({
                                    title: 'Rename error!',
                                    message: 'Could not rename key "' + $scope.key.name + '" to "' + newName + '"'
                                });
                            }

                            console.log('editKeyName / done');
                        }
                    );
                }
            });
        } 
        
        $scope.deleteKey = function() {
            console.log('deleteKey');
            var deleteKeys = [$scope.key.name];
            if (deleteKeys) {
                $scope.$parent.showModalConfirm({
                    title: 'Delete key forever?',
                    message: '1 key is about to be permanently deleted:',
                    items: deleteKeys,
                    warning: 'You can\'t undo this action!',
                    action: 'Delete'
                }).result.then(function() {
                    RedisService.deleteKeys($scope.current.serverId, $scope.current.dbId, deleteKeys).then(
                        function(response) {
                            //remove key from scope
                            $scope.key = {};
                            
                            // reduce amount of keys in search result and whole db
                            $scope.$parent.getCurrentDB().keys -= response.data.result;
                            
                            $scope.alerts.push({type: 'success', message: 'Key is succesfully deleted'});
                            
                            console.log('deleteKey / done');
                        }
                    );
                });
            }
        }
        
        $scope.newHashKey = function() {
            if ($scope.key.hash.name) {
                $scope.key.value[$scope.key.hash.name] = $scope.key.hash.value;
                $scope.key.hash = {};
            }
        }
        
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            if (angular.isDefined($routeParams.key)) {
                $scope.$parent.view = {
                    title: 'View key',
                    subtitle: $routeParams.key,
                };
            
                $scope.editKey($routeParams.key);
            }
            else {
                $scope.$parent.view = {
                    title: 'Add key',
                    subtitle: $routeParams.type,
                };
                
                $scope.addKey($routeParams.type);
            }
            
        });        
    }
]);
