<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ServerController extends AbstractRedisController
{

    /**
     * Return list of configured Redis servers.
     *
     * @return JsonResponse
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
        return new JsonResponse($servers);
    }

    /**
     * Returns list of available Dbs for the server.
     *
     * @param int $serverId
     * @return JsonResponse
     */
    public function databasesAction($serverId)
    {
        $this->initialize($serverId);

        return new JsonResponse($this->redis->getServerDbs());
    }

    /**
     * Result of INFO command for the server.
     *
     * @param int $serverId
     * @return JsonResponse
     */
    public function infoAction($serverId)
    {
        $this->initialize($serverId);

        return new JsonResponse($this->redis->getServerInfo());
    }

    /**
     * List of server clients.
     *
     * @param int $serverId
     * @return JsonResponse
     */
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

    /**
     * Kill clients of the server.
     *
     * @param Request $request
     * @param int $serverId
     * @return JsonResponse
     * @throws HttpException
     */
    public function clientsKillAction(Request $request, $serverId)
    {
        $this->initialize($serverId);

        $data = json_decode($request->getContent());

        if (empty($data->clients)) {
            throw new HttpException(400, 'Clients are not specified');
        }

        return new JsonResponse(
            array(
                'result' => $this->redis->killServerClients($data->clients),
            )
        );
    }

    /**
     * Result of CONFIG command for the server.
     *
     * @param int $serverId
     * @return JsonResponse
     */
    public function configAction($serverId)
    {
        $this->initialize($serverId);

        return new JsonResponse($this->redis->getServerConfig());
    }

}
