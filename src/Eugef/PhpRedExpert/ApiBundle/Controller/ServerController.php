<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Controller\AbstractRedisController;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\JsonResponse;

class ServerController extends AbstractRedisController
{

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
        // Todo: add commom metadata for lists: total count, page, current count
        return new JsonResponse($servers);
    }

    public function databasesAction($serverId)
    {
        $this->initialize($serverId);

        return new JsonResponse($this->redis->getServerDbs());
    }

    public function infoAction($serverId)
    {
        $this->initialize($serverId);

        return new JsonResponse($this->redis->getServerInfo());
    }

    public function clientsListAction($serverId)
    {
        $this->initialize($serverId);

        $clients = $this->redis->getServerClients();
        $clientsCount = count($clients);

        return new JsonResponse(
            array(
            'items'    => $clients,
                'metadata' => array(
                    'count'     => $clientsCount,
                    'total'     => $clientsCount,
                    'page_size' => $clientsCount,
                ),
            )
        );
    }

    public function clientsKillAction($serverId)
    {
        $this->initialize($serverId);

        $data = json_decode($this->getRequest()->getContent());

        if (empty($data->clients)) {
            throw new HttpException(400, 'Clients are not specified');
        }

        return new JsonResponse(
            array(
                'result' => $this->redis->killServerClients($data->clients),
            )
        );
    }

    public function configAction($serverId)
    {
        $this->initialize($serverId);

        return new JsonResponse($this->redis->getServerConfig());
    }

}
