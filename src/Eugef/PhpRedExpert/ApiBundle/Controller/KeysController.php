<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use FOS\RestBundle\Controller\Annotations\Get;
use FOS\RestBundle\Controller\Annotations\Post;
use FOS\RestBundle\Controller\Annotations\QueryParam;
use FOS\RestBundle\Controller\Annotations\RequestParam;
use FOS\RestBundle\Controller\Annotations\View;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\ParamConverter;
use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Eugef\PhpRedExpert\ApiBundle\Model\RedisKey;

class KeysController extends AbstractRedisController
{

    /**
     * Search for keys match specified pattern.
     *
     * @Get("/server/{serverId}/db/{dbId}/keys/search",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @QueryParam(name="pattern", requirements=".+", strict=true)
     * @QueryParam(name="page", requirements="\d+", default="0")
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param string $pattern
     * @param integer $page
     * @throws HttpException
     * @return array List of keys with detailed information
     */
    public function searchAction($serverId, $dbId, $pattern, $page)
    {
        $this->initialize($serverId, $dbId);

        $itemsPerPage = $this->container->getParameter('search_per_page');

        $keys = $this->redis->searchKeys($pattern, $page * $itemsPerPage, $itemsPerPage, $total);

        return array(
            'items'    => $keys,
            'metadata' => array(
                'page'      => $page,
                'count'     => count($keys),
                'total'     => $total,
                'page_size' => $itemsPerPage,
            ),
        );
    }

    /**
     * Delete keys by names.
     *
     * @Post("/server/{serverId}/db/{dbId}/keys/delete",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @RequestParam(name="keys", array=true, requirements=".+")
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param array $keys
     * @throws HttpException
     * @return array result
     */
    public function deleteAction($serverId, $dbId, array $keys)
    {
        $this->initialize($serverId, $dbId);

        return array(
            'result' => $this->redis->deleteKeys($keys),
        );
    }

    /**
     * Move keys to other DB.
     *
     * @Post("/server/{serverId}/db/{dbId}/keys/move",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @RequestParam(name="keys", array=true, requirements=".+")
     * @RequestParam(name="db", requirements="\d+", strict=true)
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param array $keys
     * @param integer $db
     * @throws HttpException
     * @return array result
     */
    public function moveAction($serverId, $dbId, array $keys, $db)
    {
        $this->initialize($serverId, $dbId);

        if (!$this->redis->isDbExist($db)) {
            throw new HttpException(400, 'New database doesn\'t exist');
        }
        
        if ($db == $dbId) {
            throw new HttpException(400, 'New database must be different from the current');
        }

        return array(
            'result' => $this->redis->moveKeys($keys, $db),
        );
    }

    /**
     * Change attributes (name and ttl) for the key.
     *
     * @Post("/server/{serverId}/db/{dbId}/keys/attrs",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @RequestParam(name="key", requirements=".+")
     * @RequestParam(name="attributes", array=true)
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param string $key
     * @param array $attributes
     * @throws HttpException
     * @return array result
     */
    public function attributesAction($serverId, $dbId, $key, array $attributes)
    {
        $this->initialize($serverId, $dbId);

        return array(
            'result' => $this->redis->editKeyAttributes($key, $attributes),
        );
    }

    /**
     * View the key value.
     *
     * @Get("/server/{serverId}/db/{dbId}/keys/view",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @QueryParam(name="key", requirements=".+", strict=true)
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param string $key
     * @throws HttpException
     * @return array Key value data
     */
    public function viewAction($serverId, $dbId, $key)
    {
        $this->initialize($serverId, $dbId);

        $result = $this->redis->getKey($key);

        if (!$result) {
            throw new HttpException(404, 'Key is not found');
        }

        return array(
            'key' => $result,
        );
    }

    /**
     * Edit the key value.
     *
     * @Post("/server/{serverId}/db/{dbId}/keys/edit",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @RequestParam(name="name", requirements=".+")
     * @RequestParam(name="type", requirements=".+")
     * @RequestParam(name="ttl", requirements="\d+")
     * @RequestParam(name="value", array=true)
     * @ParamConverter("key", converter="fos_rest.request_body", class="Eugef\PhpRedExpert\ApiBundle\Model\RedisKey")
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param RedisKey $key
     * @throws HttpException
     * @return array key value data
     */
    public function editAction($serverId, $dbId, RedisKey $key)
    {
        $this->initialize($serverId, $dbId);

        if (!$key->hasName()) {
            throw new HttpException(400, 'Key name is not specified');
        }

        if (!in_array($key->getType(), RedisConnector::$KEY_TYPES, true)) {
            throw new HttpException(400, 'Key type is invalid');
        }

        $result = $this->redis->editKey($key);

        if ($result === false) {
            throw new HttpException(404, 'Key is not updated');
        }

        return array(
            'key' => $this->redis->getKey($key->getName()),
        );
    }

    /**
     * Add new key with value.
     *
     * @Post("/server/{serverId}/db/{dbId}/keys/add",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @RequestParam(name="name", requirements=".+")
     * @RequestParam(name="type", requirements=".+")
     * @RequestParam(name="ttl", requirements="\d+")
     * @RequestParam(name="value", array=true)
     * @ParamConverter("key", converter="fos_rest.request_body", class="Eugef\PhpRedExpert\ApiBundle\Model\RedisKey")
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param RedisKey $key
     * @throws HttpException
     * @return array
     */
    public function addAction($serverId, $dbId, RedisKey $key)
    {
        $this->initialize($serverId, $dbId);

        if (!$key->hasName()) {
            throw new HttpException(400, 'Key name is not specified');
        }

        if (!in_array($key->getType(), RedisConnector::$KEY_TYPES, true)) {
            throw new HttpException(400, 'Key type is invalid');
        }

        $result = $this->redis->addKey($key);

        if ($result === false) {
            throw new HttpException(404, 'Key is not added');
        }

        return array(
            'key' => $this->redis->getKey($key->getName()),
        );
    }

    /**
     * Delete key value(s).
     *
     * @Post("/server/{serverId}/db/{dbId}/keys/delete-values",
     *      requirements = {"serverId": "\d+", "dbId": "\d+"}
     * )
     * @RequestParam(name="name", requirements=".+")
     * @RequestParam(name="type", requirements=".+")
     * @RequestParam(name="value", array=true)
     * @ParamConverter("key", converter="fos_rest.request_body", class="Eugef\PhpRedExpert\ApiBundle\Model\RedisKey")
     * @View()
     *
     * @param integer $serverId
     * @param integer $dbId
     * @param RedisKey $key
     * @throws HttpException
     * @return array
     */
    public function deleteValuesAction($serverId, $dbId, RedisKey $key)
    {
        $this->initialize($serverId, $dbId);

        if (!$key->hasName()) {
            throw new HttpException(400, 'Key name is not specified');
        }

        if (!in_array($key->getType(), RedisConnector::$KEY_TYPES, true)) {
            throw new HttpException(400, 'Key type is invalid');
        }

        if (!$key->hasValue('delete')) {
            throw new HttpException(400, 'Key values to be deleted are not specified');
        }

        $result = $this->redis->deleteKeyValues($key);

        if ($result === false) {
            throw new HttpException(404, 'Key values are not deleted');
        }

        return array(
            'key' => $this->redis->getKey($key->getName()),
        );
    }

}
