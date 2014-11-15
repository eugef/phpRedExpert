# Contributing

## Using VM to develop

Development should be done within provided VM.

Folowing dependencies should be installed:
* [Vagrant](https://www.vagrantup.com/downloads.html)
* [Virtual box](https://www.virtualbox.org/wiki/Downloads)
* NFSd for Linux machines

Modify your `etc/hosts` file and add this line:

```
192.168.56.101	phpredexpert.dev
```

Simply run `vagrant up` in project root folder to start VM, now you can access `http://phpredexpert.dev`
