App.filter('sec2time', function() {
    return function(input) {
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

            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (seconds < 10) {
                seconds = '0' + seconds;
            }

            return (days ? days + ' day(s) ' : '') + hours + ':' + minutes + ':' + seconds;
        }
        else {
            return '-';
        }
    }
});
