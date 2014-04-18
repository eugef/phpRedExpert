<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Controller\AbstractRedisController;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\JsonResponse;

class KeysController extends AbstractRedisController
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
        $this->initialize($serverId, $dbId);
        
        $searchConfig = $this->container->getParameter('search');
        $page = abs($this->getRequest()->get('page', 0));
        $pattern = trim($this->getRequest()->get('pattern', NULL));
        
        if (!$pattern) {
            throw new HttpException(400, 'Search pattern is not specified');
        }
        
        $keys = $this->redis->searchKeys($pattern, $page * $searchConfig['items_per_page'], $searchConfig['items_per_page'], $total);

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
    
    public function deleteAction($serverId, $dbId) 
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($this->getRequest()->getContent());
        
        if (empty($data->keys)) {
            throw new HttpException(400, 'Keys are not specified');
        }
        
        return new JsonResponse(
            array(
                'result' => $this->redis->deleteKeys($data->keys),
            )            
        );
    }
    
    public function attributesAction($serverId, $dbId) 
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($this->getRequest()->getContent());
        
        if (empty($data->key)) {
            throw new HttpException(400, 'Key is not specified');
        }
        
        if (empty($data->attributes)) {
            throw new HttpException(400, 'Attributes are not specified');
        }
        
        return new JsonResponse(
            array(
                'result' => $this->redis->editKeyAttributes($data->key, $data->attributes),
            )            
        );
    }
    
    public function valueAction($serverId, $dbId) 
    {
        $this->initialize($serverId, $dbId);
        
        $key = trim($this->getRequest()->get('key', NULL));
        
        if (!$key) {
            throw new HttpException(400, 'Key name is not specified');
        }
        
        return new JsonResponse(
            array(
                'key' => $this->redis->getKey($key)
            )            
        );
    }
    
    public function editAction($serverId, $dbId) 
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($this->getRequest()->getContent());
        
        if (empty($data->key->name)) {
            throw new HttpException(400, 'Key is not specified');
        }
        
        if (empty($data->key->type)) {
            throw new HttpException(400, 'Key type is not specified');
        }
        
        if (!in_array($data->key->type, RedisConnector::$KEY_TYPES)) {
            throw new HttpException(400, 'Key type is invalid');
        }
        
        $result = $this->redis->editKey($data->key);
        
        if (!$result) {
            throw new HttpException(400, 'Key is not updated');
        }
        
        return new JsonResponse(
            array(
                'key' => $result,
            )            
        );
    }
    
    public function addAction($serverId, $dbId) 
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($this->getRequest()->getContent());
        
        if (empty($data->key->name)) {
            throw new HttpException(400, 'Key is not specified');
        }
        
        if (empty($data->key->type)) {
            throw new HttpException(400, 'Key type is not specified');
        }
        
        if (!in_array($data->key->type, RedisConnector::$KEY_TYPES)) {
            throw new HttpException(400, 'Key type is invalid');
        }
        
        $result = $this->redis->addKey($data->key);
        
        if (!$result) {
            throw new HttpException(400, 'Key is not added');
        }
        
        return new JsonResponse(
            array(
                'key' => $result,
            )            
        );
    }
}
