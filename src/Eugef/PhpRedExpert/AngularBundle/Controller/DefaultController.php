<?php

namespace Eugef\PhpRedExpert\AngularBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;

class DefaultController extends Controller
{
    public function indexAction() 
    {
        return $this->render('EugefPhpRedExpertAngularBundle:Default:index.html.twig', array());
    }
}
