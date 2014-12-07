<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Symfony\Component\HttpKernel\Exception\HttpException;
use FOS\RestBundle\Controller\FOSRestController;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;

abstract class AbstractRedisController extends FOSRestController
{

    /**
     * Redis connector
     * @var RedisConnector 
     */
    protected $redis;

    /**
     * Initialize with the specified server and db
     * 
     * @param integer $serverId
     * @param integer $dbId
     * @throws HttpException
     */
    protected function initialize($serverId, $dbId = null)
    {
        $servers = $this->container->getParameter('redis_servers');

        if (empty($servers[$serverId])) {
            throw new HttpException(404, 'Server not found');
        }

        $this->redis = new RedisConnector($servers[$serverId]);

        if (!is_null($dbId)) {
            if (!$this->redis->selectDb($dbId)) {
                throw new HttpException(404, 'Database not found');
            }
        }
    }

}
