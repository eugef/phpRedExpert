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
        
        $scope.selectKeyExclusive = function(index) {
            console.log('keySelect: ' + index);
       
            for (i=0; i<$scope.search.result.keys.length; i++) {
                if (index == i) {
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
        
        $scope.deleteSelectedKeys = function() {
            console.log('deleteSelectedKeys');
            deleteKeys = $scope.search.result.selected;
            if (deleteKeys) {

                $scope.$parent.showModalConfirm({
                    title: 'Delete key(s) forever?',
                    message: (deleteKeys.length == 1 ? '1 key is' : deleteKeys.length + ' keys are') + ' about to be permanently deleted:',
                    items: deleteKeys,
                    undo: false,
                    action: {
                        ok: 'Delete'
                    }
                }).result.then(function() {
                    RedisService.deleteKeys($scope.current.serverId, $scope.current.dbId, deleteKeys).then(
                        function(response) {
                            console.log(response);
                            // remove deleted keys from scope
                            for (i = $scope.search.result.keys.length - 1; i >= 0; i--) {
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
        
        // change sorting order
        $scope.sortBy = function(field) {
            console.log('sortBy: ' + field);
            if ($scope.search.sort.field == field) {
                $scope.search.sort.reverse = !$scope.search.sort.reverse;
            } 
            else {
                $scope.search.sort.field = field;
                $scope.search.sort.reverse = false;
            }
        };
        
        $scope.setPage = function(page) {
            console.log('set page: ' + page + '[' + $scope.search.page + ']');
            console.log($scope.search);
            $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern) + '/' + encodeURIComponent(page), false);
            $scope.searchKey($scope.search.pattern, page);
        };
        
        $scope.$watch('search.result.keys', function(){
            $scope.search.result.selected = [];
            for (i=0; i<$scope.search.result.keys.length; i++) {
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
                page = parseInt($routeParams.page, 10) > 0 ? parseInt($routeParams.page, 10) : 1;
                $scope.searchKey($routeParams.pattern, page);
            }
        });        
    }
]);
