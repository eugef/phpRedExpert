<?php

namespace Eugef\PhpRedExpertBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\JsonResponse;
use Eugef\PhpRedExpertBundle\Utils\RedisConnector;

class DatabaseController extends Controller
{
    public function KeySearchAction($serverId, $dbId)
    {
        $searchConfig = $this->container->getParameter('search');
        $servers = $this->container->getParameter('redis_servers');
        
        $page = abs($this->getRequest()->get('page'));
        $pattern = trim($this->getRequest()->get('pattern'));
        
        if ($pattern && isset($servers[$serverId])) {
            $redis = new RedisConnector($servers[$serverId]);
            // TODO: check if DB exists
            $redis->selectDB($dbId);
                        
            return new JsonResponse(
                $redis->keySearch($pattern, $page * $searchConfig['items_per_page'], $searchConfig['items_per_page'])
            );
        }
        else {
            // TODO: throw an error
            return new JsonResponse(array('error'));
        }        
        
    }  
}
