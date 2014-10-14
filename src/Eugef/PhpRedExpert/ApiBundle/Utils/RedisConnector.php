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

    public static function hasValue($keyName)
    {
        return (isset($keyName) && strlen($keyName));
    }
    
    /**
     * Convert value to UTF-8 encoding
     * 
     * Key values can contain non UTF-8 characters that should be converted.
     * 
     * @TODO move $from_encoding to config (per DB or server)
     * 
     * @param mixed $value Array or string
     * @return mixed
     */
    public static function convertUTF8($value) {
        if (is_array($value)) {
            $newValue = array();
            foreach ($value as $key => $item) {
                if (is_string($item)) {
                    $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8');
                }
                if (is_string($key)) {
                    $key = mb_convert_encoding($key, 'UTF-8', 'UTF-8');
                }
                $newValue[$key] = $item;
            }; 
        }
        elseif (is_string($value)) {
            $newValue = mb_convert_encoding($value, 'UTF-8', 'UTF-8');
        }
        else {
            $newValue = $value;
        }
        
        return $newValue;
    }
    
    private function getDbConfigValue($id, $name, $default = NULL)
    {
        if (isset($this->config['databases'][$id][$name])) {
            return $this->config['databases'][$id][$name];
        }
        else {
            return $default;
        }
    }

    public function selectDb($dbId)
    {
        return $this->db->select($dbId);
    }

    public function isDbExist($dbId)
    {
        return ($dbId >= 0) && ($dbId < $this->getServerConfig('databases', TRUE));
    }

    public function getServerDbs()
    {
        $info = $this->db->info();
        $databases = $this->getServerConfig('databases', TRUE) | 1;

        $result = array();

        for ($i = 0; $i < $databases - 1; $i++) {
            if (isset($info['db' . $i])) {
                $dbInfoValues = array();
                preg_match('/^keys=([0-9]+),expires=([0-9]+)/', $info['db' . $i], $dbInfoValues);
                $result[$i] = array(
                    'id'      => $i,
                    'keys'    => (int) $dbInfoValues[1],
                    'expires' => (int) $dbInfoValues[2],
                    'default' => $this->getDbConfigValue($i, 'default'),
                    'name'    => $this->getDbConfigValue($i, 'name'),
                );
            }
            else {
                // Database is empty
                $result[$i] = array(
                    'id'      => $i,
                    'keys'    => 0,
                    'expires' => 0,
                    'default' => $this->getDbConfigValue($i, 'default'),
                    'name'    => $this->getDbConfigValue($i, 'name'),
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
            case \Redis::REDIS_STRING:
                $size = $this->db->strlen($keyName);
                break;
            
            case \Redis::REDIS_HASH:
                $size = $this->db->hLen($keyName);
                break;
            
            case \Redis::REDIS_LIST:
                $size = $this->db->lSize($keyName);
                break;
            
            case \Redis::REDIS_SET:
                $size = $this->db->sCard($keyName);
                break;
            
            case \Redis::REDIS_ZSET:
                $size = $this->db->zCard($keyName);
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
                'name'     => $keys[$i],
                'type'     => $this->getKeyType($keys[$i]),
                'encoding' => $this->getKeyEncoding($keys[$i]),
                'ttl'      => $this->getKeyTTL($keys[$i]),
                'size'     => $this->getKeySize($keys[$i]),
            );
        }

        return $result;
    }

    public function deleteKeys($keyNames)
    {
        return $this->db->delete($keyNames);
    }

    public function moveKeys($keyNames, $newDb)
    {
        $result = 0;
        
        foreach ($keyNames as $keyName) {
            $result += $this->db->move($keyName, $newDb);
        }
        
        return $result;
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
            
            case \Redis::REDIS_HASH:
                $keyValue = $this->db->hGetAll($keyName);
                break;
                
            case \Redis::REDIS_LIST:
                $keyValue = $this->db->lRange($keyName, 0, -1);
                break;    
                
            case \Redis::REDIS_SET:
                $keyValue = $this->db->sMembers($keyName);
                break;
            
            case \Redis::REDIS_ZSET:
                $keyValue = $this->db->zRange($keyName, 0, -1, TRUE);
                break;
        }

        if ($keyValue !== FALSE) {
            return array(
                'name'     => $keyName,
                'type'     => self::$KEY_TYPES[$keyType],
                'encoding' => $this->getKeyEncoding($keyName),
                'ttl'      => $this->getKeyTTL($keyName),
                'size'     => $this->getKeySize($keyName),
                'value'    => self::convertUTF8($keyValue),
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
                    $result = $this->db->hset($key->name, $key->value->field, isset($key->value->value) ? $key->value->value : '');
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
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
                            $result = $this->db->lset($key->name, (int) $key->value->index, $key->value->value);
                            break;
                        case 'append':
                        default:
                            $result = $this->db->rpush($key->name, $key->value->value);
                    }
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                $result = $this->db->sadd($key->name, isset($key->value->value) ? $key->value->value : '');
                break;

            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                if (self::hasValue($key->value->score)) {
                    $result = $this->db->zadd($key->name, $key->value->score, isset($key->value->value) ? $key->value->value : '');
                }
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
                $result = $this->db->sadd($key->name, isset($key->value->value) ? $key->value->value : '');
                break;

            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                if (self::hasValue($key->value->score)) {
                    $result = $this->db->zadd($key->name, $key->value->score, isset($key->value->value) ? $key->value->value : '');
                }
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

    public function deleteKeyValues($key)
    {
        $result = FALSE;

        switch ($key->type) {
            case self::$KEY_TYPES[\Redis::REDIS_HASH]:
                foreach ($key->values as $keyValue) {
                    $result = $this->db->hdel($key->name, $keyValue);
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
                // workaround to delete list item by index:
                foreach ($key->values as $keyValue) {
                    // http://redis.io/commands/lrem#comment-1375293995
                    $deleteValue = uniqid('phpredexpert-delete-', TRUE);
                    $result = $this->db->multi()->lset($key->name, $keyValue, $deleteValue)->lrem($key->name, $deleteValue)->exec();
                }
                // save result of last operation in a transaction
                $result = end($result);
                break;

            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                foreach ($key->values as $keyValue) {
                    $result = $this->db->srem($key->name, $keyValue);
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                foreach ($key->values as $keyValue) {
                    $result = $this->db->zrem($key->name, $keyValue);
                }
                break;
        }

        return $result;
    }

    public function getServerInfo()
    {
        return $this->db->info();
    }

    public function getServerClients()
    {
        $clients = $this->db->client('LIST');
        for ($i = 0; $i < count($clients); $i++) {
            $clients[$i]['fd'] = (int) $clients[$i]['fd'];
            $clients[$i]['age'] = (int) $clients[$i]['age'];
            $clients[$i]['idle'] = (int) $clients[$i]['idle'];
            $clients[$i]['db'] = (int) $clients[$i]['db'];
            $clients[$i]['sub'] = (int) $clients[$i]['sub'];
            $clients[$i]['psub'] = (int) $clients[$i]['psub'];
            $clients[$i]['qbuf'] = (int) $clients[$i]['qbuf'];
            $clients[$i]['qbuf-free'] = (int) $clients[$i]['qbuf-free'];
            $clients[$i]['obl'] = (int) $clients[$i]['obl'];
            $clients[$i]['oll'] = (int) $clients[$i]['oll'];
            $clients[$i]['multi'] = (int) $clients[$i]['multi'];
            $clients[$i]['omem'] = (int) $clients[$i]['omem'];
        }
        return $clients;
    }

    public function killServerClients($clients)
    {
        foreach ($clients as $client) {
            $this->db->client('KILL', $client);
        }
        return TRUE;
    }

    public function getServerConfig($pattern = '*', $onlyValue = FALSE)
    {
        $result = $this->db->config('GET', $pattern);
        if ($onlyValue) {
            $result = reset($result);
        }
        return $result;
    }

    public function flushDb()
    {
        $this->db->flushDB();
        return TRUE;
    }

}
