App.controller('KeyController', ['$scope', '$routeParams', '$location', '$log', 'RedisService',
    function ($scope, $routeParams, $location, $log, RedisService) {
        $log.debug('KeyController', $routeParams);

        $scope.key = {};
        $scope.keyValue = {};
        $scope.alerts = [];
        
        $scope.initAddKey = function(keyType) {
            $log.debug('initAddKey', arguments);
            
            $scope.key = {
                new: true,
                type: keyType,
                ttl: 0
            }

            $scope.keyValue = $scope.defaultKeyValue(keyType);
        }

        $scope.initEditKey = function(keyName) {
            $log.debug('initEditKey', arguments);
            
            return RedisService.viewKey($scope.current.serverId, $scope.current.dbId, keyName).then(
                function(response) {
                    $scope.key = response.data.key;
                    $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl; 
                    
                    $scope.keyValue = $scope.defaultKeyValue($scope.key.type, $scope.key.value);

                    $log.debug('initEditKey / done', $scope.key);
                },
                function(response) {
                    // key not found - add its name for warning message
                    $scope.key = {
                        name: keyName
                    };
                }
            );    
        }
        
        $scope.defaultKeyValue = function(keyType, value) {
            switch (keyType) {
                case 'string':
                    return {
                        value: angular.isDefined(value) ? value : ''
                    };
                case 'hash':
                    return {
                        field: '',
                        value: ''
                    };
                case 'list':
                    return {
                        value: '',
                        action: 'append',
                        pivot: '',
                        index: 0
                    };
                case 'set':
                    return {
                        value: ''
                    };
                case 'zset':
                    return {
                        score: 0,
                        value: ''
                    };
            }
        }
                
        $scope.submitKey = function() {
            var key = {
                name: $scope.key.name,
                type: $scope.key.type,
                ttl: $scope.key.ttl,
                value: $scope.keyValue
            };
            
            if ($scope.key.new) {
                $log.debug('submitKey: add');
                
                return RedisService.addKey($scope.current.serverId, $scope.current.dbId, key).then(
                    function(response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $scope.keyValue = $scope.defaultKeyValue($scope.key.type, $scope.key.value);
                        
                        // increase amount of keys in whole db
                        $scope.$parent.getCurrentDB().keys++;
                        
                        // change location for new key
                        $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + $scope.key.name, false);
                        
                        $log.debug('submitKey: add / done', $scope.key);
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not created'});
                    }
                );
            }
            else {
                $log.debug('submitKey: edit');
                
                return RedisService.editKey($scope.current.serverId, $scope.current.dbId, key).then(
                    function(response) {
                        $scope.key = response.data.key;
                        $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                        $scope.keyValue = $scope.defaultKeyValue($scope.key.type, $scope.key.value);
                        
                        $log.debug('submitKey: edit / done', $scope.key);
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key is not updated'});
                    }
                );
            }
        }
        
        $scope.initEditHashField = function(field) {
            $scope.keyValue = {
                field: field,
                value: $scope.key.value[field]
            };
        }
        
        $scope.initEditListItem = function(index) {
            $scope.keyValue = {
                action: 'set',
                value: $scope.key.value[index],
                index: index,
                pivot: ''
            };
        }
        
        $scope.deleteKeyValue = function(value) {
            $log.debug('deleteKeyValue', arguments);
            
            var execute = function() {
                return RedisService.deleteKeyValues($scope.current.serverId, $scope.current.dbId, key).then(
                    function(response) {
                        if (response.data.key) {
                            //update key
                            $scope.key = response.data.key;
                            $scope.key.ttl = $scope.key.ttl < 0 ? 0 : $scope.key.ttl;
                            
                            $log.debug('deleteKeyValue / done', $scope.key);
                        }
                        else {
                            //remove key from scope
                            $scope.key = {
                                name: key.name
                            };
                            
                            // reduce amount of keys in whole db
                            $scope.$parent.getCurrentDB().keys --;
                            
                            $scope.alerts.push({type: 'success', message: 'Key is succesfully deleted'});
                            
                            $log.debug('deleteKeyValue / done / whole key');
                        }
                    },
                    function(response) {
                        $scope.alerts.push({type: 'danger', message: 'Key item is not deleted'});
                    }
                );
            }
            
            var key = {
                name: $scope.key.name,
                type: $scope.key.type,
                values: [value]
            };
            
            if ($scope.key.size > 1) {
                execute();
            }
            else {
                $scope.$parent.showModalConfirm({
                    title: 'Delete key forever?',
                    message: 'Key is about to be permanently deleted because no values are left:',
                    items: [key.name],
                    warning: 'You can\'t undo this action!',
                    action: 'Delete'
                }).result.then(function() {
                    execute();
                });
            }
        }
        
        $scope.editKeyTtl = function() {
            $log.debug('editKeyTtl');
                
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyttl.html',                  
                {
                    value: $scope.key.ttl,
                    key: $scope.key.name
                }
            ).result.then(function(newTtl) {
                RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {ttl: newTtl}).then(
                    function(response) {
                        $log.debug('editKeyTtl / done', response.data)
                        
                        $scope.key.ttl = newTtl;
                    }
                );
            });
        }  
        
        $scope.editKeyName = function() {
            $log.debug('editKeyName');
            
            $scope.$parent.showModal('ModalEditKeyAttributeController', 'editkeyname.html',                 
                {
                    value: $scope.key.name,
                    key: $scope.key.name
                }
            ).result.then(function(newName) {
                if (newName != $scope.key.name) {
                    RedisService.editKeyAttributes($scope.current.serverId, $scope.current.dbId, $scope.key.name, {name: newName}).then(
                        function(response) {
                            $log.debug('editKeyName / done', response.data)
                            
                            if (response.data.result.name) {
                                $scope.key.name = newName;
                                // update key name in url
                                $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/key/view/' + $scope.key.name, false);
                            }
                            else {
                                $scope.$parent.showModalAlert({
                                    title: 'Rename error!',
                                    message: 'Could not rename key "' + $scope.key.name + '" to "' + newName + '"'
                                });
                            }
                        }
                    );
                }
            });
        }
        
        $scope.deleteKey = function() {
            $log.debug('deleteKey');
            
            $scope.$parent.showModalConfirm({
                title: 'Delete key forever?',
                message: 'Key is about to be permanently deleted:',
                items: [$scope.key.name],
                warning: 'You can\'t undo this action!',
                action: 'Delete'
            }).result.then(function() {
                RedisService.deleteKeys($scope.current.serverId, $scope.current.dbId, [$scope.key.name]).then(
                    function(response) {
                        $log.debug('deleteKey / done', response.data);

                        //remove key from scope
                        $scope.key = {
                            name: $scope.key.name
                        };

                        // reduce amount of keys in whole db
                        $scope.$parent.getCurrentDB().keys -= response.data.result;

                        $scope.alerts.push({type: 'success', message: 'Key is succesfully deleted'});
                    }
                );
            });
        }
        
        $scope.moveKey = function() {
            $log.debug('moveKey');

            $scope.$parent.showModal('ModalEditKeyAttributeController', 'movekeys.html',                  
                {
                    title: 'Move the key?',
                    message: 'Key is about to be moved:',
                    items: [$scope.key.name],
                    databases: $scope.$parent.dbs
                }
            ).result.then(function(newDB) {
                RedisService.moveKeys($scope.current.serverId, $scope.current.dbId, [$scope.key.name], newDB).then(
                    function(response) {
                        $log.debug('moveKey / done', response.data);
                        
                        //remove key from scope
                        $scope.key = {
                            name: $scope.key.name
                        };

                        // reduce amount of keys in current db
                        $scope.$parent.getCurrentDB().keys -= response.data.result;

                        // increase amount of keys in a new db
                        // make it visible (usefull when db was empty)
                        $scope.$parent.getDB(newDB).keys += response.data.result;
                        $scope.$parent.getDB(newDB).visible = true;

                        $scope.alerts.push({type: 'success', message: 'Key is succesfully moved'});
                    }
                );
            });
        }
        
        $scope.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $log.debug('KeyController.init');
            
            if (angular.isDefined($routeParams.key)) {
                $scope.$parent.view = {
                    title: 'View key',
                    subtitle: $routeParams.key
                };
            
                $scope.initEditKey($routeParams.key);
            }
            else {
                $scope.$parent.view = {
                    title: 'Add key',
                    subtitle: $routeParams.type
                };
                
                $scope.initAddKey($routeParams.type);
            }
        });        
    }
]);
