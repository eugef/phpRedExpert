<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Controller\AbstractRedisController;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpFoundation\JsonResponse;

class DatabaseController extends AbstractRedisController
{
    public function flushAction($serverId, $dbId) 
    {
        $this->initialize($serverId, $dbId);

        return new JsonResponse(
            array(
                'result' => $this->redis->flushDB(),
            )            
        );
    }
}
