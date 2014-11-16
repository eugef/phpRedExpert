<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;

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
