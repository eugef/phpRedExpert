<?php

namespace Eugef\PhpRedExpertBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{

    public function indexAction() 
    {
        return $this->render('EugefPhpRedExpertBundle:Default:index.html.twig', array());
    }
  
}
