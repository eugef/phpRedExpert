App.directive('activeLink', ['$location',
    function($location) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var path = attrs.activeLink ? 'activeLink' : 'href';
                var target = angular.isDefined(attrs.activeLinkParent) ? elem.parent() : elem;
                var disabled = angular.isDefined(attrs.activeLinkDisabled) ? true : false;
                var nested = angular.isDefined(attrs.activeLinkNested) ? true : false;
                
                function inPath(needle, haystack) {
                    var current = (haystack == needle);
                    if (nested) {
                        current |= (haystack.indexOf(needle + '/') == 0);
                    }
                    
                    return current;
                }
                
                function toggleClass(linkPath, locationPath) {
                    // remove hash prefix and trailing slashes
                    linkPath = linkPath ? linkPath.replace(/^#!/, '').replace(/\/+$/, '') : '';
                    locationPath = locationPath.replace(/\/+$/, '');
                    
                    if (linkPath && inPath(linkPath, locationPath)) {
                        target.addClass('active');
                        if (disabled) {
                            target.removeClass('disabled');
                        }
                    } else {
                        target.removeClass('active');
                        if (disabled) {
                            target.addClass('disabled');
                        }
                    }
                }
                
                // watch if attribute value changes / evaluated
                attrs.$observe(path, function(linkPath) {
                    toggleClass(linkPath, $location.path());
                });

                // watch if location changes
                scope.$watch(
                    function() {
                        return $location.path(); 
                    }, 
                    function(newPath) {
                        toggleClass(attrs[path], newPath);
                    }
                );
            }
        };
    }
]);
