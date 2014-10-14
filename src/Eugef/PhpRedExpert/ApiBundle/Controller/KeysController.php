<?php

namespace Eugef\PhpRedExpert\ApiBundle\Controller;

use Eugef\PhpRedExpert\ApiBundle\Utils\RedisConnector;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class KeysController extends AbstractRedisController
{

    /**
     * Search for keys match specified pattern.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @throws HttpException
     * @return JsonResponse
     *          List of keys with detailed information
     */
    public function searchAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $itemsPerPage = $this->container->getParameter('search_per_page');
        $page = abs($request->get('page', 0));
        $pattern = trim($request->get('pattern', NULL));

        if (!$pattern) {
            throw new HttpException(400, 'Search pattern is not specified');
        }

        $keys = $this->redis->searchKeys($pattern, $page * $itemsPerPage, $itemsPerPage, $total);

        return new JsonResponse(
            array(
                'items'    => $keys,
                'metadata' => array(
                    'count'     => count($keys),
                    'total'     => $total,
                    'page_size' => $itemsPerPage,
                ),
            )
        );
    }

    /**
     * Delete keys by name.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function deleteAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($request->getContent());

        if (empty($data->keys)) {
            throw new HttpException(400, 'Keys are not specified');
        }

        return new JsonResponse(
            array(
                'result' => $this->redis->deleteKeys($data->keys),
            )
        );
    }

    /**
     * Move keys to other DB.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function moveAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($request->getContent());

        if (empty($data->keys)) {
            throw new HttpException(400, 'Keys are not specified');
        }

        if (!$this->redis->isDbExist($data->db)) {
            throw new HttpException(400, 'New database doesn\'t exist');
        }
        
        if ($data->db == $dbId) {
            throw new HttpException(400, 'New database must be different from the current');
        }

        return new JsonResponse(
            array(
                'result' => $this->redis->moveKeys($data->keys, $data->db),
            )
        );
    }

    /**
     * Change attributes (name and ttl) for the key.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function attributesAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($request->getContent());

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

    /**
     * View the key value.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function viewAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $key = trim($request->get('key', NULL));

        if (!RedisConnector::hasValue($key)) {
            throw new HttpException(400, 'Key name is not specified');
        }

        $result = $this->redis->getKey($key);

        if (!$result) {
            throw new HttpException(404, 'Key is not found');
        }

        return new JsonResponse(
            array(
                'key' => $result,
            )
        );
    }

    /**
     * Edit the key value.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function editAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($request->getContent());

        if (!RedisConnector::hasValue($data->key->name)) {
            throw new HttpException(400, 'Key is not specified');
        }

        if (empty($data->key->type)) {
            throw new HttpException(400, 'Key type is not specified');
        }

        if (!in_array($data->key->type, RedisConnector::$KEY_TYPES)) {
            throw new HttpException(400, 'Key type is invalid');
        }

        $result = $this->redis->editKey($data->key);

        if ($result === FALSE) {
            throw new HttpException(404, 'Key is not updated');
        }

        return new JsonResponse(
            array(
                'key' => $this->redis->getKey($data->key->name),
            )
        );
    }

    /**
     * Add new key with value.
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function addAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($request->getContent());

        if (!RedisConnector::hasValue($data->key->name)) {
            throw new HttpException(400, 'Key is not specified');
        }

        if (empty($data->key->type)) {
            throw new HttpException(400, 'Key type is not specified');
        }

        if (!in_array($data->key->type, RedisConnector::$KEY_TYPES)) {
            throw new HttpException(400, 'Key type is invalid');
        }

        $result = $this->redis->addKey($data->key);

        if ($result === FALSE) {
            throw new HttpException(404, 'Key is not added');
        }

        return new JsonResponse(
            array(
                'key' => $this->redis->getKey($data->key->name),
            )
        );
    }

    /**
     * Delete key value(s).
     *
     * @param Request $request
     * @param int $serverId
     * @param int $dbId
     * @return JsonResponse
     * @throws HttpException
     */
    public function deleteValuesAction(Request $request, $serverId, $dbId)
    {
        $this->initialize($serverId, $dbId);

        $data = json_decode($request->getContent());

        if (!RedisConnector::hasValue($data->key->name)) {
            throw new HttpException(400, 'Key is not specified');
        }

        if (empty($data->key->type)) {
            throw new HttpException(400, 'Key type is not specified');
        }

        if (empty($data->key->values)) {
            throw new HttpException(400, 'Key values are not specified');
        }

        if (!is_array($data->key->values)) {
            $data->key->values = array($data->key->values);
        }

        $result = $this->redis->deleteKeyValues($data->key);

        if ($result === FALSE) {
            throw new HttpException(404, 'Key values are not deleted');
        }

        return new JsonResponse(
            array(
                'key' => $this->redis->getKey($data->key->name),
            )
        );
    }

}
