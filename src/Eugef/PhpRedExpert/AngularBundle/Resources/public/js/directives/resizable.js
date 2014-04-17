App.directive('resizable', ['$window', 
    function($window) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                resizeElement = function(wrapperHeight) {
                    wrapperHeight = angular.isDefined(wrapperHeight) ? wrapperHeight : document.querySelector(attrs.resizableWrapper).clientHeight;

                    elem.css(attrs.resizableStyle, Math.max(wrapperHeight, $window.innerHeight - elem.prop(('offsetTop'))) + 'px');
                };

                // resize on window
                angular.element($window).bind('resize', function() {
                    resizeElement();
                    scope.$apply();
                });

                // resize when wrapper height is changed
                scope.$watch(
                    function() {
                        return document.querySelector(attrs.resizableWrapper).clientHeight;
                    }, 
                    function(wrapperHeight) {
                        resizeElement(wrapperHeight);
                    }
                );
            }
        }
    }
]);
