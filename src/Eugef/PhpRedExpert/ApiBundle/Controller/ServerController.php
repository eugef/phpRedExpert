<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Controller\AbstractRedisController;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpFoundation\JsonResponse;

class ServerController extends AbstractRedisController
{
    public function listAction()
    {
        $servers = array();
        foreach ($this->container->getParameter('redis_servers') as $id => $server) {
           $servers[$id] = array(
               'id' => $id,
               'host' => $server['host'],
               'port' => empty($server['port']) ? RedisConnector::PORT_DEFAULT : $server['port'],
               'name' => empty($server['name']) ? '' : $server['name'],
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
    
    public function clientsAction($serverId) 
    {
        $this->initialize($serverId);
        
        $clients = $this->redis->getServerClients();

        return new JsonResponse(
            array(
                'items' => $clients,
                'metadata' => array(
                    'count' => sizeof($clients),
                    'total' => sizeof($clients),
                    'page_size' => sizeof($clients),
                ),
            )            
        );
    }
    
    public function configAction($serverId) 
    {
        $this->initialize($serverId);
        
        return new JsonResponse($this->redis->getServerConfig());
    }        

}
