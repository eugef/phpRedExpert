<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use FOS\RestBundle\Controller\Annotations\Get,
    FOS\RestBundle\Controller\Annotations\Post,
    FOS\RestBundle\Controller\Annotations\RequestParam,
    FOS\RestBundle\Controller\Annotations\View;

use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;

class ServerController extends AbstractRedisController
{

    /**
     * Return list of configured Redis servers.
     *
     * @Get("/server/list")
     * @View()
     *
     * @return array list
     */
    public function listAction()
    {
        $servers = array();
        foreach ($this->container->getParameter('redis_servers') as $id => $server) {
            $servers[$id] = array(
                'id'       => $id,
                'host'     => $server['host'],
                'port'     => empty($server['port']) ? RedisConnector::PORT_DEFAULT : $server['port'],
                'name'     => empty($server['name']) ? '' : $server['name'],
                'password' => empty($server['password']) ? false : true,
            );
        }
        // Todo: add common metadata for lists: total count, page, current count
        return $servers;
    }

    /**
     * Returns list of available Dbs for the server.
     *
     * @Get("/server/{serverId}/databases",
     *      requirements = {"serverId": "\d+"}
     * )
     * @View()
     *
     * @param int $serverId
     * @return array list
     */
    public function databasesAction($serverId)
    {
        $this->initialize($serverId);

        return $this->redis->getServerDbs();
    }

    /**
     * Result of INFO command for the server.
     *
     * @Get("/server/{serverId}/info",
     *      requirements = {"serverId": "\d+"}
     * )
     * @View()
     *
     * @param int $serverId
     * @return array list
     */
    public function infoAction($serverId)
    {
        $this->initialize($serverId);

        return $this->redis->getServerInfo();
    }

    /**
     * Result of CONFIG command for the server.
     *
     * @Get("/server/{serverId}/config",
     *      requirements = {"serverId": "\d+"}
     * )
     * @View()
     *
     * @param int $serverId
     * @return array list
     */
    public function configAction($serverId)
    {
        $this->initialize($serverId);

        return $this->redis->getServerConfig();
    }

    /**
     * List of server clients.
     *
     * @Get("/server/{serverId}/clients",
     *      requirements = {"serverId": "\d+"}
     * )
     * @View()
     *
     * @param int $serverId
     * @return array list
     */
    public function clientsListAction($serverId)
    {
        $this->initialize($serverId);

        $clients = $this->redis->getServerClients();
        $clientsCount = count($clients);

        return array(
            'items'    => $clients,
            'metadata' => array(
                'count'     => $clientsCount,
                'total'     => $clientsCount,
                'page_size' => $clientsCount,
            ),
        );
    }

    /**
     * Kill clients of the server.
     *
     * @Post("/server/{serverId}/clients/kill",
     *      requirements = {"serverId": "\d+"}
     * )
     * @RequestParam(name="clients", array=true, requirements=".+")
     * @View()
     *
     * @param int $serverId
     * @param array $clients
     * @return array result
     */
    public function clientsKillAction($serverId, $clients)
    {
        $this->initialize($serverId);

        return array(
            'result' => $this->redis->killServerClients($clients),
        );
    }

}
