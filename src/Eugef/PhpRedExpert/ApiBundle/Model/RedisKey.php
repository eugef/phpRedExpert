<?php

namespace Eugef\PhpRedExpert\ApiBundle\Model;

use JMS\Serializer\Annotation as Serializer;

class RedisKey {

    /**
     * @var array
     */
    public static $TYPES = array('string', 'hash', 'list', 'set', 'zset');

    /**
     * @Serializer\SerializedName("name")
     * @Serializer\Type("string")
     *
     * @var string
     */
    private $name;

    /**
     * @Serializer\Type("string")
     *
     * @var string
     */
    private $type;

    /**
     * @Serializer\Type("integer")
     *
     * @var int
     */
    private $ttl;

    /**
     * @Serializer\Type("array")
     *
     * @var array
     */
    private $value;

    /**
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * @return bool
     */
    public function hasName()
    {
        return strlen($this->name) > 0;
    }

    /**
     * @param string $name
     */
    public function setName($name)
    {
        $this->name = $name;
    }

    /**
     * @return int
     */
    public function getTtl()
    {
        return $this->ttl;
    }

    /**
     * @param int $ttl
     */
    public function setTtl($ttl)
    {
        $this->ttl = $ttl;
    }

    /**
     * @return string
     */
    public function getType()
    {
        return $this->type;
    }

    /**
     * @param string $type
     */
    public function setType($type)
    {
        $this->type = $type;
    }

    /**
     * @param string $item
     * @param mixed $default
     * @return mixed
     */
    public function getValue($item, $default = null)
    {
        return $this->hasValue($item) ? $this->value[$item] : $default;
    }

    /**
     * @param $item
     * @return bool
     */
    public function hasValue($item)
    {
        if (isset($this->value[$item])) {
            $value = $this->value[$item];

            if (is_scalar($value)) {
                return strlen($value) > 0;
            }

            if (is_array($value)) {
                return count($value) > 0;
            }

            return !empty($value);
        }

        return false;
    }

    /**
     * @param array $value
     */
    public function setValue($value)
    {
        $this->value = $value;
    }


}