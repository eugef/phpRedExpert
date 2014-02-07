<?php

namespace Eugef\PhpRedExpertBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Template;

class DefaultController extends Controller
{
    /**
     * @Template("EugefPhpRedExpertBundle:Default:index.html.twig")
     */
    public function indexAction() 
    {
        return array('name' => 'tg');
    }
  
}
