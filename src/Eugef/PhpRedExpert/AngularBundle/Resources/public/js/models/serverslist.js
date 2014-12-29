App.factory('ServersListModel', ['ServerModel',
    function (Server) {
        "use strict";

        /**
         * @constructor
         */
        function ServersList() {

            /**
             * @type {Server[]}
             */
            var servers = [];

            /**
             * @type {Number}
             */
            var indexDefault = 0;

            /**
             * @type {Number}
             */
            var indexCurrent = indexDefault;

            /**
             * @param {Number} id
             * @returns {Number|null}
             */
            var indexById = function (id) {
                for (var i = 0; i < servers.length; i++) {
                    if (servers[i].id == id) {
                        return i;
                    }
                }

                return null;
            };

            /**
             * @type {Server[]}
             * @readonly
             */
            Object.defineProperty(this, 'list', {
                enumerable: true,
                get: function () {
                    return servers;
                }
            });

            /**
             * @type {Boolean}
             * @readonly
             */
            Object.defineProperty(this, 'isEmpty', {
                enumerable: true,
                get: function () {
                    return servers.length == 0;
                }
            });

            /**
             * @type {Number}
             * @readonly
             */
            Object.defineProperty(this, 'length', {
                enumerable: true,
                get: function () {
                    return servers.length;
                }
            });

            /**
             * @param {Array} dataList
             */
            this.set = function (dataList) {
                servers = [];

                dataList.forEach(function (data) {
                    servers.push(
                        new Server(data)
                    );
                });
            };

            /**
             * @param {Number} id
             * @returns {Server|null}
             */
            this.byId = function (id) {
                var index = indexById(id);

                if (index !== null) {
                    return servers[index];
                } else {
                    return null;
                }
            };

            /**
             * @param {Number} id
             * @returns {Boolean}
             */
            this.isExist = function (id) {
                return indexById(id) !== null;
            };

            /**
             * @returns {Server}
             */
            this.default = function () {
                return servers[indexDefault];
            };

            /**
             * @param {Number} [id]
             * @returns {Server}
             */
            this.current = function (id) {
                if (id !== undefined) {
                    var index = indexById(id);

                    if (index !== null) {
                        indexCurrent = index;
                    } else {
                        indexCurrent = indexDefault;
                    }
                }

                return servers[indexCurrent];
            };
        }

        return ServersList;
    }
]);
