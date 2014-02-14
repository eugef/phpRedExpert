<?php

namespace  Eugef\PhpRedExpertBundle\Utils;

/**
 * Description of RedisConnector
 *
 * @author eugef
 */
class RedisConnector extends \Redis
{
    private $config = array();
    
    public function __construct($config) {
        $this->connect($config['host'], $config['port']);
        
        if (isset($config['password'])) {
            $this->auth($config['password']);
        }    
        
        $this->config = $config;
        //$this->select($config['database']);
    }

    public function changeDB($db) {
        $this->select($db);

        return $this;
    }
    
    private function getDBConfigValue($id, $name, $default = NULL) {
        if (isset($this->config['databases'][$id][$name])) {
            return $this->config['databases'][$id][$name];
        }
        else {
            return $default;
        }
    }
    
    public function getDbs()
    {
        $info = $this->info();
        
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
}
