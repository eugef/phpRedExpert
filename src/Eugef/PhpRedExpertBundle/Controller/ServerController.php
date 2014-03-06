<?php

namespace Eugef\PhpRedExpertBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Eugef\PhpRedExpertBundle\Utils\RedisConnector;

class ServerController extends Controller
{
    public function ListAction()
    {
        $servers = array();
        foreach ($this->container->getParameter('redis_servers') as $id => $server) {
           $servers[$id] = array(
               'id' => $id,
               'host' => $server['host'],
               'port' => $server['port'],
               'name' => empty($server['name']) ? '' : $server['name'],
               'password' => empty($server['password']) ? false : true,
           );
        }
        // Todo: add commom metadata for lists: total count, page, current count
        return new JsonResponse($servers);
    }
    
    public function DatabasesAction($serverId)
    {
        $servers = $this->container->getParameter('redis_servers');
        
        if (!isset($servers[$serverId])) {
            throw new HttpException(404, 'Server not found');
        }    
            
        $redis = new RedisConnector($servers[$serverId]);
        return new JsonResponse($redis->getDbs());
    }   

}
