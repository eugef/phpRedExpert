<?php

namespace  Eugef\PhpRedExpertBundle\Utils;

/**
 * Description of RedisConnector
 *
 * @author eugef
 */
class RedisConnector extends \Redis
{
    public function __construct($config) {
        $this->connect($config['host'], $config['port']);
        
        if (isset($config['password'])) {
            $this->auth($config['password']);
        }    
        
        $this->select($config['database']);
    }

    public function changeDB($db) {
        $this->select($db);

        return $this;
    }
    
    public function getDbs()
    {
        $info = $this->info();
        
        $result = array();
        
        array_walk($info, function($value, $key) use (&$result) {
            if (preg_match('/^db([0-9]+)?$/', $key, $keyMatches)) {
                preg_match('/^keys=([0-9]+),expires=([0-9]+)/', $value, $valueMatches);
                $result[$keyMatches[1]] = array(
                    'id' => $keyMatches[1],
                    'keys' => $valueMatches[1],
                    'expires' => $valueMatches[2],
                    'name' => '',
                );
            }
        });

        return $result;
    }
}
