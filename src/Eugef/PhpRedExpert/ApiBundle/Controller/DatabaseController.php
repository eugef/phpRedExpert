<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use FOS\RestBundle\Controller\Annotations\Post;
use FOS\RestBundle\Controller\Annotations\View;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DatabaseController extends AbstractRedisController
{

    /**
     * Flush DB.
     *
     * @Post("/server/{serverId}/db/{dbId}/flush",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @throws HttpException
     * @return array result
     */
    public function flushAction($serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        return array(
            'result' => $this->redis->flushDB(),
        );
    }

}
