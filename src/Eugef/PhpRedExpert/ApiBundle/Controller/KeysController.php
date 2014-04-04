<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;

class KeysController extends Controller
{
    /**
     * Search for keys match specified pattern
     * 
     * @param int $serverId
     * @param int $dbId
     * @return \Symfony\Component\HttpFoundation\JsonResponse 
     *          List of keys with detailed information
     * @throws HttpException
     */
    public function searchAction($serverId, $dbId)
    {
        $searchConfig = $this->container->getParameter('search');
        $servers = $this->container->getParameter('redis_servers');
        
        if (!isset($servers[$serverId])) {
            throw new HttpException(404, 'Server not found');
        }    
            
        $redis = new RedisConnector($servers[$serverId]);
        
        if (!$redis->selectDB($dbId)) {
            throw new HttpException(404, 'Database not found');
        }   
        
        $page = abs($this->getRequest()->get('page', 0));
        $pattern = trim($this->getRequest()->get('pattern', NULL));
        
        if (!$pattern) {
            throw new HttpException(400, 'Search pattern is not specified');
        }
        
        $keys = $redis->searchKeys($pattern, $page * $searchConfig['items_per_page'], $searchConfig['items_per_page'], $total);

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
    
    public function deleteAction($serverId, $dbId) {
        $servers = $this->container->getParameter('redis_servers');
        
        if (!isset($servers[$serverId])) {
            throw new HttpException(404, 'Server not found');
        }    
            
        $redis = new RedisConnector($servers[$serverId]);
        
        if (!$redis->selectDB($dbId)) {
            throw new HttpException(404, 'Database not found');
        }   

        $data = json_decode($this->getRequest()->getContent());
        
        if (!$data->keys) {
            throw new HttpException(400, 'Keys are not specified');
        }
        
        return new JsonResponse(
            array(
                'result' => $redis->deleteKeys($data->keys),
            )            
        );
    }
}
