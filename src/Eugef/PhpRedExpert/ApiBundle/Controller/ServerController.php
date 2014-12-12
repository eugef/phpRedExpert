<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use FOS\RestBundle\Controller\Annotations\Get;
use FOS\RestBundle\Controller\Annotations\Post;
use FOS\RestBundle\Controller\Annotations\RequestParam;
use FOS\RestBundle\Controller\Annotations\View;
use Symfony\Component\HttpKernel\Exception\HttpException;
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
    public function getServersListAction()
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
        return $servers;
    }

    /**
     * Result of INFO command for the server.
     *
     * @Get("/server/{serverId}/info",
     *      requirements = {"serverId": "\d+"}
     * )
     * @View()
     *
     * @param integer $serverId
     * @throws HttpException
     * @return array list
     */
    public function getServerInfoAction($serverId)
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
     * @param integer $serverId
     * @throws HttpException
     * @return array list
     */
    public function getServerConfigAction($serverId)
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
     * @param integer $serverId
     * @throws HttpException
     * @return array list
     */
    public function getServerClientsListAction($serverId)
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
     * @throws HttpException
     * @return array result
     */
    public function killServerClientsAction($serverId, array $clients)
    {
        $this->initialize($serverId);

        return array(
            'result' => $this->redis->killServerClients($clients),
        );
    }

}
