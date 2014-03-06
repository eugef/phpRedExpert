<?php

namespace Eugef\PhpRedExpertBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpKernel\Exception\HttpException;
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
        
        if (!isset($servers[$serverId])) {
            throw new HttpException(404, 'Server not found');
        }    
            
        $redis = new RedisConnector($servers[$serverId]);
        
        if (!$redis->selectDB($dbId)) {
            throw new HttpException(404, 'Database not found');
        }   
        
        if (!$pattern) {
            throw new HttpException(400, 'Search pattern is not specified');
        }
        
        $keys = $redis->keySearch($pattern, $page * $searchConfig['items_per_page'], $searchConfig['items_per_page'], $total);

        return new JsonResponse(
            array(
                'items' => $keys,
                'metadata' => array(
                    'count' => sizeof($keys),
                    'total' => $total,
                    'page_size' => $searchConfig['items_per_page'],
                ),
            )            
        );
    }  
}
