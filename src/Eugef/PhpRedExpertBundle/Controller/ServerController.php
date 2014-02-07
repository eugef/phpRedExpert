<?php

namespace Eugef\PhpRedExpertBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Eugef\PhpRedExpertBundle\Utils\RedisConnector;

class ServerController extends Controller
{
    public function ListAction()
    {
        $servers = array();
        foreach ($this->container->getParameter('redis_servers') as $id => $server) {
           $servers[$id] = array(
               'host' => $server['host'],
               'port' => $server['port'],
               'name' => $server['name'],
               'database' => $server['database'],
           );
        }
        
        return new JsonResponse($servers);
    }
    
    public function DatabasesAction($serverId)
    {
        $servers = $this->container->getParameter('redis_servers');
        if (isset($servers[$serverId])) {
            $redis = new RedisConnector($servers[$serverId]);
            return new JsonResponse($redis->getDbs());
        }
        else {
            return new JsonResponse(array('error'));
        }
        
        
    }   

}
