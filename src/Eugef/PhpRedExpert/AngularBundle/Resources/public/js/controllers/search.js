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
                count: 0,
                total: 0,
                pageSize: 1
            }        
        };        
        
        $scope.submitSearch = function() {
			if ($scope.searchForm.$valid) {
                $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern), false);
                $scope.keySearch($scope.search.pattern, 1);
			}
            
        }
        
        $scope.keySearch = function(pattern, page) {
            console.log('keySearch: ' + page + '[' + $scope.search.page + ']');
            $scope.search.pattern = pattern;
                        
            return RedisService.keySearch($scope.current.serverId, $scope.current.dbId, pattern, page).then(
                function(response) {
                    /*
                     * because pagination plugin watches total count and page,
                     * these variables should be changed in one scope
                     */
                    $scope.search.page = page;
                    $scope.search.result.pattern = pattern;
                    $scope.search.result.count = response.data.metadata.count;
                    $scope.search.result.total = response.data.metadata.total;
                    $scope.search.result.pageSize = response.data.metadata.page_size;
                    
                    $scope.search.result.keys = [];
                    angular.forEach(response.data.items, function(value){
                        $scope.search.result.keys.push(value);
                    });

                    console.log('keySearch / done');
                }
            );
        }
        
        $scope.keySelectExclusive = function(event, index) {
            console.log('keySelect: ' + index);
            if (!(event.target.tagName == 'INPUT' && event.target.type == 'checkbox')) {
                for (i=0; i<$scope.search.result.keys.length; i++) {
                    if (index == i) {
                        $scope.search.result.keys[i].selected = true;
                    }
                    else {
                        $scope.search.result.keys[i].selected = false;
                    }
                }
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
            $scope.keySearch($scope.search.pattern, page);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $scope.$parent.view = {
                title: 'Database',
                subtitle: $scope.getCurrentDB().name
            };
            
            if ($routeParams.pattern) {
                console.log('search');
                console.log($routeParams);
                page = parseInt($routeParams.page, 10) > 0 ? parseInt($routeParams.page, 10) : 1;
                $scope.keySearch($routeParams.pattern, page);
            }
        });        
    }
]);
