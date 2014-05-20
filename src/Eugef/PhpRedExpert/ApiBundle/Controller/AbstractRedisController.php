<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;

abstract class AbstractRedisController extends Controller
{

    /**
     * Redis connector
     * @var RedisConnector 
     */
    protected $redis;

    /**
     * Initialize with the specified server and db
     * 
     * @param int $serverId
     * @param int $dbId
     * @throws HttpException
     */
    protected function initialize($serverId, $dbId = NULL)
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
