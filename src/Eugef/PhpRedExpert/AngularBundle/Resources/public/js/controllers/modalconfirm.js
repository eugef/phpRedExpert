App.controller('ModalConfirmController', ['$scope', '$modalInstance', 'data',
    function ($scope, $modalInstance, data) {
        console.log('ModalConfirmController');
        
        $scope.title = data.title;
        $scope.message = data.message;
        $scope.items = angular.isDefined(data.items) ? data.items : [];
        $scope.undo = angular.isDefined(data.undo) ? data.undo : true;
        
        $scope.action = {
            ok: angular.isDefined(data.action.ok) ? data.action.ok : 'Ok',
            cancel: angular.isDefined(data.action.cancel) ? data.action.cancel : 'Cancel',
        }
        
        $scope.ok = function() {
            $modalInstance.close();
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };      
    }
]);
