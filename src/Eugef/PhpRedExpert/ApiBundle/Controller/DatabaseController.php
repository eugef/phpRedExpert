<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use FOS\RestBundle\Controller\Annotations\Get;
use FOS\RestBundle\Controller\Annotations\Post;
use FOS\RestBundle\Controller\Annotations\View;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DatabaseController extends AbstractRedisController
{

    /**
     * Returns list of available databases.
     *
     * @Get("/server/{serverId}/databases",
     *      requirements = {"serverId": "\d+"}
     * )
     * @View()
     *
     * @param integer $serverId
     * @throws HttpException
     * @return array list
     */
    public function getDatabasesListAction($serverId)
    {
        $this->initialize($serverId);

        return $this->redis->getDatabases();
    }

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
    public function flushDatabaseAction($serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        return array(
            'result' => $this->redis->flushDB(),
        );
    }

}
