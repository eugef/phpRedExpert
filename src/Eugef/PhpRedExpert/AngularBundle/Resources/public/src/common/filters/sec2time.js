angular.module('eugef.sec2time', []).filter('sec2time',
    function () {
        "use strict";

        /**
         * @param {Number|String} value
         * @returns {Number|String}
         */
        function zeroPad(value) {
            if (value < 10) {
                value = '0' + value;
            }

            return value;
        }

        /**
         * @param {String} input
         * @returns {String}
         */
        function filter(input) {
            if (input > 0) {
                var sec_num = parseInt(input, 10);
                var days = 0;
                var hours = Math.floor(sec_num / 3600);
                var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
                var seconds = sec_num - (hours * 3600) - (minutes * 60);

                if (hours >= 23) {
                    days = Math.floor(hours / 24);
                    hours = hours - (days * 24);
                }

                return (days ? days + ' day(s) ' : '') + zeroPad(hours) + ':' + zeroPad(minutes) + ':' + zeroPad(seconds);
            }
            else {
                return '-';
            }
        }

        return filter;
    });
