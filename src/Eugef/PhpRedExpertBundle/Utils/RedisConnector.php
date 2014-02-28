<?php

namespace  Eugef\PhpRedExpertBundle\Utils;

/**
 * Description of RedisConnector
 *
 * @author eugef
 */
class RedisConnector
{
    private $config = array();
    private $db;
    
    private function getDBConfigValue($id, $name, $default = NULL) {
        if (isset($this->config['databases'][$id][$name])) {
            return $this->config['databases'][$id][$name];
        }
        else {
            return $default;
        }
    }
    
    public function __construct($config) {
        $this->db = new \Redis();
        $this->db->connect($config['host'], $config['port']);
        
        if (isset($config['password'])) {
            $this->db->auth($config['password']);
        }    
        
        $this->config = $config;
    }

    public function selectDB($dbId) {
        $this->db->select($dbId);
    }
    
    public function getDbs()
    {
        $info = $this->db->info();
        
        $result = array();
        
        foreach ($info as $key => $value) {
            if (preg_match('/^db([0-9]+)?$/', $key, $keyMatches)) {
                preg_match('/^keys=([0-9]+),expires=([0-9]+)/', $value, $valueMatches);
                $result[$keyMatches[1]] = array(
                    'id' => $keyMatches[1],
                    'keys' => $valueMatches[1],
                    'expires' => $valueMatches[2],
                    'default' => $this->getDBConfigValue($keyMatches[1], 'default'),
                    'name' => $this->getDBConfigValue($keyMatches[1], 'name'),
                );
            }
        }

        return $result;
    }
    
    private function getKeyType($key)
    {
        switch ($this->db->type($key)) {
            case \Redis::REDIS_STRING:
                return 'string';
            case \Redis::REDIS_SET:
                return 'set';
            case \Redis::REDIS_LIST:
                return 'list';
            case \Redis::REDIS_ZSET:
                return 'zset';
            case \Redis::REDIS_HASH:
                return 'hash';
            default:
                return '-';
        }
    }

    private function getKeyTTL($key)
    {
        return $this->db->ttl($key);

    }

    private function getKeyEncoding($key)
    {
        return $this->db->object('encoding', $key);
    }

    private function getKeySize($key)
    {
        switch ($this->db->type($key)) {
            case \Redis::REDIS_LIST:
                $size = $this->db->lSize($key);
                break;
            case \Redis::REDIS_SET:
                $size = $this->db->sCard($key);
                break;
            case \Redis::REDIS_HASH:
                $size = $this->db->hLen($key);
                break;
            case \Redis::REDIS_ZSET:
                $size = $this->db->zCard($key);
                break;
            case \Redis::REDIS_STRING:
                $size = $this->db->strlen($key);
                break;
            default:
                $size = -1;
        }

        return $size;
    }
    
    public function keySearch($pattern, $offset = 0, $length = NULL) {
        $result = array();
            
        $keys = $this->db->keys($pattern);
        $totalCount = $keysCount = count($keys);
        
        if ($offset || ($length && $length < $keysCount)) {
            $keys = array_slice($keys, $offset, $length);
            $keysCount = count($keys);
        }    
        
        sort($keys);

        for ($i = 0; $i < $keysCount; $i++) {
            $result['keys'][] = array(
                'name' => $keys[$i],
                'type' => $this->getKeyType($keys[$i]),
                'encoding' => $this->getKeyEncoding($keys[$i]),
                'ttl' => $this->getKeyTTL($keys[$i]),
                'size' => $this->getKeySize($keys[$i]),
            );
        }
        
        $result['count'] = $keysCount;
        $result['total'] = $totalCount;
        
        return $result;
    }
}
