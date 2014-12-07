<?php

namespace Eugef\PhpRedExpert\ApiBundle\Utils;

use Eugef\PhpRedExpert\ApiBundle\Model\RedisKey;

class RedisConnector
{
    const PORT_DEFAULT = 6379;

    /**
     * @var array
     */
    public static $KEY_TYPES = array(
        \Redis::REDIS_STRING => 'string',
        \Redis::REDIS_HASH   => 'hash',
        \Redis::REDIS_LIST   => 'list',
        \Redis::REDIS_SET    => 'set',
        \Redis::REDIS_ZSET   => 'zset',
    );

    /**
     * @var array
     */
    private $config = array();

    /**
     * @var \Redis()
     */
    private $db;

    /**
     * @param array $config
     */
    public function __construct(array $config)
    {
        $this->db = new \Redis();
        $this->db->connect($config['host'], $config['port']);

        if (isset($config['password'])) {
            $this->db->auth($config['password']);
        }

        $this->config = $config;
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

    /**
     * @param integer $dbId
     * @param string $name
     * @param mixed $default
     * @return mixed
     */
    private function getDbConfigValue($dbId, $name, $default = null)
    {
        if (isset($this->config['databases'][$dbId][$name])) {
            return $this->config['databases'][$dbId][$name];
        }
        else {
            return $default;
        }
    }

    /**
     * @param integer $dbId
     * @return boolean
     */
    public function selectDb($dbId)
    {
        return $this->db->select($dbId);
    }

    /**
     * @param integer $dbId
     * @return boolean
     */
    public function isDbExist($dbId)
    {
        return ($dbId >= 0) && ($dbId < $this->getServerConfig('databases', true));
    }

    /**
     * @return array
     */
    public function getServerDbs()
    {
        $info = $this->db->info();
        $databases = $this->getServerConfig('databases', true) | 1;

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

    /**
     * @param string $keyName
     * @return string
     */
    private function getKeyType($keyName)
    {
        return self::$KEY_TYPES[$this->db->type($keyName)];
    }

    /**
     * @param string $keyName
     * @return integer
     */
    private function getKeyTTL($keyName)
    {
        return $this->db->ttl($keyName);
    }

    /**
     * @param string $keyName
     * @return string
     */
    private function getKeyEncoding($keyName)
    {
        return $this->db->object('encoding', $keyName);
    }

    /**
     * @param string $keyName
     * @return integer
     */
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

    /**
     * @param string $pattern
     * @param integer $offset
     * @param integer $length
     * @param integer $totalCount
     * @return array
     */
    public function searchKeys($pattern, $offset = 0, $length = null, &$totalCount = null)
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

    /**
     * @param array $keyNames
     * return integer
     */
    public function deleteKeys(array $keyNames)
    {
        return $this->db->delete($keyNames);
    }

    /**
     * @param array $keyNames
     * @param integer $newDb
     * @return integer
     */
    public function moveKeys(array $keyNames, $newDb)
    {
        $result = 0;
        
        foreach ($keyNames as $keyName) {
            $result += $this->db->move($keyName, $newDb);
        }
        
        return $result;
    }

    /**
     * @param string $keyName
     * @param array $attributes
     * @return array
     */
    public function editKeyAttributes($keyName, array $attributes)
    {
        $result = array();

        if (isset($attributes['ttl'])) {
            if ($attributes['ttl'] > 0) {
                $result['ttl'] = $this->db->expire($keyName, $attributes['ttl']);
            }
            else {
                $result['ttl'] = $this->db->persist($keyName);
            }
        }

        if (isset($attributes['name'])) {
            $result['name'] = $this->db->renamenx($keyName, trim($attributes['name']));
        }

        return $result;
    }

    /**
     * @param string $keyName
     * @return array|boolean
     */
    public function getKey($keyName)
    {
        $keyValue = false;
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
                $keyValue = $this->db->zRange($keyName, 0, -1, true);
                break;
        }

        if ($keyValue !== false) {
            return array(
                'name'     => $keyName,
                'type'     => self::$KEY_TYPES[$keyType],
                'encoding' => $this->getKeyEncoding($keyName),
                'ttl'      => $this->getKeyTTL($keyName),
                'size'     => $this->getKeySize($keyName),
                'value'    => self::convertUTF8($keyValue),
            );
        } else {
            return false;
        }
    }

    /**
     * @param RedisKey $key
     * @return boolean
     */
    public function editKey(RedisKey $key)
    {
        $result = false;
        switch ($key->getType()) {
            case self::$KEY_TYPES[\Redis::REDIS_STRING]:
                $result = $this->db->set($key->getName(), $key->getValue('value', ''), $key->getTtl());
                break;

            case self::$KEY_TYPES[\Redis::REDIS_HASH]:
                if ($key->hasValue('field')) {
                    $result = $this->db->hset($key->getName(), $key->getValue('field'), $key->getValue('value', ''));
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
                if ($key->hasValue('value')) {
                    switch ($key->getValue('action')) {
                        case 'prepend':
                            $result = $this->db->lpush($key->getName(), $key->getValue('value'));
                            break;
                        case 'before':
                            $result = $this->db->linsert($key->getName(), \Redis::BEFORE, $key->getValue('pivot'), $key->getValue('value'));
                            break;
                        case 'after':
                            $result = $this->db->linsert($key->getName(), \Redis::AFTER, $key->getValue('pivot'), $key->getValue('value'));
                            break;
                        case 'set':
                            $result = $this->db->lset($key->getName(), (int) $key->getValue('index'), $key->getValue('value'));
                            break;
                        case 'append':
                        default:
                            $result = $this->db->rpush($key->getName(), $key->getValue('value'));
                    }
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                $result = $this->db->sadd($key->getName(), $key->getValue('value', ''));
                break;

            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                if ($key->hasValue('value')) {
                    $result = $this->db->zadd($key->getName(), (float) $key->getValue('score', 0), $key->getValue('value'));
                }
                break;
        }

        return $result;
    }

    /**
     * @param RedisKey $key
     * @return boolean
     */
    public function addKey(RedisKey $key)
    {
        $result = false;
        switch ($key->getType()) {
            case self::$KEY_TYPES[\Redis::REDIS_STRING]:
                $result = $this->db->setnx($key->getName(), $key->getValue('value', ''));
                break;

            case self::$KEY_TYPES[\Redis::REDIS_HASH]:
                if ($key->hasValue('field')) {
                    $result = $this->db->hsetnx($key->getName(), $key->getValue('field'), $key->getValue('value', ''));
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
                if ($key->hasValue('value')) {
                    switch ($key->getValue('action')) {
                        case 'prepend':
                            $result = $this->db->lpush($key->getName(), $key->getValue('value'));
                            break;
                        case 'append':
                        default:
                            $result = $this->db->rpush($key->getName(), $key->getValue('value'));
                    }
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                $result = $this->db->sadd($key->getName(), $key->getValue('value', ''));
                break;

            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                if ($key->hasValue('value')) {
                    $result = $this->db->zadd($key->getName(), (float)$key->getValue('score', 0), $key->getValue('value'));
                }
                break;
        }

        if ($result) {
            // Add TTL if key was created
            if ($key->getTtl() > 0) {
                $this->db->expire($key->getName(), $key->getTtl());
            }
        }

        return $result;
    }

    /**
     * @param RedisKey $key
     * @return boolean
     */
    public function deleteKeyValues(RedisKey $key)
    {
        $result = false;

        switch ($key->getType()) {
            case self::$KEY_TYPES[\Redis::REDIS_HASH]:
                foreach ($key->getValue('delete') as $keyValue) {
                    $result = $this->db->hdel($key->getName(), $keyValue);
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_LIST]:
                foreach ($key->getValue('delete') as $keyIndex) {
                    // workaround to delete list item by index:
                    // http://redis.io/commands/lrem#comment-1375293995
                    $deleteValue = uniqid('phpredexpert-delete-', true);
                    $result = $this->db
                        ->multi()
                            ->lset($key->getName(), $keyIndex, $deleteValue)
                            ->lrem($key->getName(), $deleteValue)
                        ->exec();
                }
                // save result of last operation in a transaction
                $result = end($result);
                break;

            case self::$KEY_TYPES[\Redis::REDIS_SET]:
                foreach ($key->getValue('delete') as $keyValue) {
                    $result = $this->db->srem($key->getName(), $keyValue);
                }
                break;

            case self::$KEY_TYPES[\Redis::REDIS_ZSET]:
                foreach ($key->getValue('delete') as $keyValue) {
                    $result = $this->db->zrem($key->getName(), $keyValue);
                }
                break;
        }

        return $result;
    }

    /**
     * @return array
     */
    public function getServerInfo()
    {
        return $this->db->info();
    }

    /**
     * @return array
     */
    public function getServerClients()
    {
        $clients = $this->db->client('LIST');

        // Convert integer values to int type
        foreach ($clients as &$client) {
            array_walk($client, function(&$item) {
                $item = is_numeric($item) ? (int) $item : $item;
            });
        }

        return $clients;
    }

    /**
     * @param array $clients
     * @return boolean
     */
    public function killServerClients(array $clients)
    {
        foreach ($clients as $client) {
            $this->db->client('KILL', $client);
        }

        return true;
    }

    /**
     * @param string $pattern
     * @param boolean $onlyValue
     * @return array|string
     */
    public function getServerConfig($pattern = '*', $onlyValue = false)
    {
        $result = $this->db->config('GET', $pattern);

        if ($onlyValue) {
            $result = reset($result);
        }

        return $result;
    }

    /**
     * @return boolean
     */
    public function flushDb()
    {
        return $this->db->flushDB();
    }

}
