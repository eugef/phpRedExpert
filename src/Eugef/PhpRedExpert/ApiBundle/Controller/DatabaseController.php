<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DatabaseController extends AbstractRedisController
{

    /**
     * Flush DB.
     *
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     */
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
