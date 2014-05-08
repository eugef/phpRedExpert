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
        \Redis::REDIS_HASH   => 'hash',
        \Redis::REDIS_LIST   => 'list',
        \Redis::REDIS_SET    => 'set',
        \Redis::REDIS_ZSET   => 'zset',
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
    
    public static function hasValue($keyName) {
        return (isset($keyName) && strlen($keyName));
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

    private function getKeyType($keyName)
    {
        return self::$KEY_TYPES[$this->db->type($keyName)];
    }

    private function getKeyTTL($keyName)
    {
        return $this->db->ttl($keyName);
    }

    private function getKeyEncoding($keyName)
    {
        return $this->db->object('encoding', $keyName);
    }

    private function getKeySize($keyName)
    {
        switch ($this->db->type($keyName)) {
            case \Redis::REDIS_LIST:
                $size = $this->db->lSize($keyName);
                break;
            case \Redis::REDIS_SET:
                $size = $this->db->sCard($keyName);
                break;
            case \Redis::REDIS_HASH:
                $size = $this->db->hLen($keyName);
                break;
            case \Redis::REDIS_ZSET:
                $size = $this->db->zCard($keyName);
                break;
            case \Redis::REDIS_STRING:
                $size = $this->db->strlen($keyName);
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

    public function deleteKeys($keyNames)
    {
        return $this->db->delete($keyNames);
    }

    public function editKeyAttributes($keyName, $attributes)
    {
        $result = array();

        if (isset($attributes->ttl)) {
            if ($attributes->ttl > 0) {
                $result['ttl'] = $this->db->expire($keyName, $attributes->ttl);
            } 
            else {
                $result['ttl'] = $this->db->persist($keyName);
            }
        }

        if (isset($attributes->name)) {
            $result['name'] = $this->db->renamenx($keyName, trim($attributes->name));
        }

        return $result;
    }

    public function getKey($keyName)
    {
        $keyValue = FALSE;
        $keyType = $this->db->type($keyName);

        switch ($keyType) {
            case \Redis::REDIS_STRING:
                $keyValue = $this->db->get($keyName);
                break;
            case \Redis::REDIS_SET:
                $keyValue = $this->db->sMembers($keyName);
                break;
            case \Redis::REDIS_LIST:
                // TODO: add pagination for list items here
                $keyValue = $this->db->lRange($keyName, 0, -1);
                break;
            case \Redis::REDIS_ZSET:
                // TODO: add pagination for sorted sets items here
                $keyValue = $this->db->zRange($keyName, 0, -1, TRUE);
                break;
            case \Redis::REDIS_HASH:
                $keyValue = $this->db->hGetAll($keyName);
                break;
        }

        if ($keyValue !== FALSE) {
            return array(
                'name' => $keyName,
                'type' => self::$KEY_TYPES[$keyType],
                'encoding' => $this->getKeyEncoding($keyName),
                'ttl' => $this->getKeyTTL($keyName),
                'size' => $this->getKeySize($keyName),
                'value' => $keyValue,
            );
        } 
        else {
            return FALSE;
        }
    }

    public function editKey($key)
    {
        $result = FALSE;
        switch ($key->type) {
            case self::$KEY_TYPES[\Redis::REDIS_STRING]:
                $result = $this->db->set($key->name, isset($key->value->value) ? $key->value->value : '');
                break;
            
            case self::$KEY_TYPES[\Redis::REDIS_HASH]:
                if (self::hasValue($key->value->field)) {
                    if (!empty($key->value->delete)) {
                        $result = $this->db->hdel($key->name, $key->value->field);
                    }
                    else {
                        $result = $this->db->hset($key->name, $key->value->field, isset($key->value->value) ? $key->value->value : '');
                    }
                }
                break;
                
            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
                if (!empty($key->value->delete)) {
                    $deleteValue = uniqid('phpredexpert-delete-', TRUE);
                    $result = $this->db->multi()->lset($key->name, (int)$key->value->index, $deleteValue)->lrem($key->name, $deleteValue)->exec();
                    // save result of last operation in a transaction
                    $result = end($result);
                }
                else {
                    if (self::hasValue($key->value->value)) {    
                        switch ($key->value->action) {
                            case 'prepend':
                                $result = $this->db->lpush($key->name, $key->value->value);
                                break;
                            case 'before':
                                $result = $this->db->linsert($key->name, \Redis::BEFORE, $key->value->pivot, $key->value->value);
                                break;
                            case 'after':
                                $result = $this->db->linsert($key->name, \Redis::AFTER, $key->value->pivot, $key->value->value);
                                break;
                            case 'set':
                                $result = $this->db->lset($key->name, (int)$key->value->index, $key->value->value);
                                break;
                            case 'append':
                            default:
                                $result = $this->db->rpush($key->name, $key->value->value);
                        }
                    }
                }
                break;
            
            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                break;
            
            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                break;
        }
        
        return $result;
    }

    public function addKey($key)
    {
        $result = FALSE;
        switch ($key->type) {
            case self::$KEY_TYPES[\Redis::REDIS_STRING]:
                $result = $this->db->setnx($key->name, isset($key->value->value) ? $key->value->value : '');
                break;
                
            case self::$KEY_TYPES[\Redis::REDIS_HASH]:
                if (self::hasValue($key->value->field)) {
                    $result = $this->db->hsetnx($key->name, $key->value->field, isset($key->value->value) ? $key->value->value : '');
                }
                break; 
                
            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
                if (self::hasValue($key->value->value)) {
                    switch ($key->value->action) {
                        case 'prepend':
                            $result = $this->db->lpush($key->name, $key->value->value);
                            break;
                        case 'append':
                        default:
                            $result = $this->db->rpush($key->name, $key->value->value);
                    }
                }
                break;
            
            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                break;
            
            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                break;
        }
        
        if ($result) {
            // Add TTL if key was created
            if ($key->ttl > 0) {
                $this->db->expire($key->name, $key->ttl);
            }
        }
        
        return $result;
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
