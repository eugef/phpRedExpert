<?php

namespace Eugef\PhpRedExpert\ApiBundle\Utils;

/**
 * Description of RedisConnector
 *
 * @author eugef
 */
class RedisConnector
{

    const PORT_DEFAULT = 6379;

    static $KEY_TYPES = array(
        \Redis::REDIS_STRING => 'string',
        \Redis::REDIS_SET    => 'set',
        \Redis::REDIS_LIST   => 'list',
        \Redis::REDIS_ZSET   => 'zset',
        \Redis::REDIS_HASH   => 'hash',
    );
    
    private $config = array();
    private $db;

    public function __construct($config)
    {
        $this->db = new \Redis();
        $this->db->connect($config['host'], $config['port']);

        if (isset($config['password'])) {
            $this->db->auth($config['password']);
        }

        $this->config = $config;
    }

    private function getDBConfigValue($id, $name, $default = NULL)
    {
        if (isset($this->config['databases'][$id][$name])) {
            return $this->config['databases'][$id][$name];
        } 
        else {
            return $default;
        }
    }

    public function selectDB($dbId)
    {
        return $this->db->select($dbId);
    }

    public function getServerDbs()
    {
        $info = $this->db->info();

        $result = array();

        foreach ($info as $key => $value) {
            if (preg_match('/^db([0-9]+)?$/', $key, $keyMatches)) {
                preg_match('/^keys=([0-9]+),expires=([0-9]+)/', $value, $valueMatches);
                $result[$keyMatches[1]] = array(
                    'id' => (int) $keyMatches[1],
                    'keys' => (int) $valueMatches[1],
                    'expires' => (int) $valueMatches[2],
                    'default' => $this->getDBConfigValue($keyMatches[1], 'default'),
                    'name' => $this->getDBConfigValue($keyMatches[1], 'name'),
                );
            }
        }

        return $result;
    }

    private function getKeyType($key)
    {
        return self::$KEY_TYPES[$this->db->type($key)];
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

    public function searchKeys($pattern, $offset = 0, $length = NULL, &$totalCount = NULL)
    {
        $result = array();

        $keys = $this->db->keys($pattern);
        $totalCount = $keysCount = count($keys);

        // SORT_STRING slightly speed up sort
        sort($keys, SORT_STRING);

        if ($offset || ($length && $length < $keysCount)) {
            $keys = array_slice($keys, $offset, $length);
            $keysCount = count($keys);
        }

        for ($i = 0; $i < $keysCount; $i++) {
            $result[] = array(
                'name' => $keys[$i],
                'type' => $this->getKeyType($keys[$i]),
                'encoding' => $this->getKeyEncoding($keys[$i]),
                'ttl' => $this->getKeyTTL($keys[$i]),
                'size' => $this->getKeySize($keys[$i]),
            );
        }

        return $result;
    }

    public function deleteKeys($keys)
    {
        return $this->db->delete($keys);
    }

    public function editKeyAttributes($key, $attributes)
    {
        $result = array();

        if (isset($attributes->ttl)) {
            if ($attributes->ttl > 0) {
                $result['ttl'] = $this->db->expire($key, $attributes->ttl);
            } 
            else {
                $result['ttl'] = $this->db->persist($key);
            }
        }

        if (isset($attributes->name)) {
            $result['name'] = $this->db->renamenx($key, trim($attributes->name));
        }

        return $result;
    }

    public function getKey($key)
    {
        $value = FALSE;
        $keyType = $this->db->type($key);

        switch ($keyType) {
            case \Redis::REDIS_STRING:
                $value = $this->db->get($key);
                break;
            case \Redis::REDIS_SET:
                $value = $this->db->sMembers($key);
                break;
            case \Redis::REDIS_LIST:
                // TODO: add pagination for list items here
                $value = $this->db->lRange($key, 0, -1);
                break;
            case \Redis::REDIS_ZSET:
                // TODO: add pagination for sorted sets items here
                $value = $this->db->zRange($key, 0, -1, TRUE);
                break;
            case \Redis::REDIS_HASH:
                $value = $this->db->hGetAll($key);
                break;
        }

        if ($value !== FALSE) {
            return array(
                'name' => $key,
                'type' => self::$KEY_TYPES[$keyType],
                'encoding' => $this->getKeyEncoding($key),
                'ttl' => $this->getKeyTTL($key),
                'size' => $this->getKeySize($key),
                'value' => $value,
            );
        } 
        else {
            return FALSE;
        }
    }

    public function editKey($key)
    {
        switch ($key->type) {
            case self::$KEY_TYPES[\Redis::REDIS_STRING]:
                return $this->db->set($key->name, $key->value);
                break;
            case \Redis::REDIS_SET:
                break;
            case \Redis::REDIS_LIST:
                break;
            case \Redis::REDIS_ZSET:
                break;
            case \Redis::REDIS_HASH:
                break;
        }
    }

    public function addKey($key)
    {
        switch ($key->type) {
            case self::$KEY_TYPES[\Redis::REDIS_STRING]:
                if ($this->db->setnx($key->name, $key->value)) {
                    if ($key->ttl > 0) {
                        $this->db->expire($key->name, $key->ttl);
                    }
                    return TRUE;
                } 
                else {
                    return FALSE;
                }
                break;
            case \Redis::REDIS_SET:
                break;
            case \Redis::REDIS_LIST:
                break;
            case \Redis::REDIS_ZSET:
                break;
            case \Redis::REDIS_HASH:
                break;
        }
    }

    public function getServerInfo()
    {
        return $this->db->info();
    }

    public function getServerClients()
    {
        return $this->db->client('LIST');
    }

    public function getServerConfig($pattern = '*')
    {
        return $this->db->config('GET', $pattern);
    }

}
