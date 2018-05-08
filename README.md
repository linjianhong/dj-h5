# dj-h5 angular modules

## Guide

* login
* wxjssdk

## Demo

[Demo](https://linjianhong.github.io/dj-h5/demo/index.html)


## Install with Bower
$ bower install dj-h5


## Usage

#### Use after download

```
<link rel="stylesheet" href="yourlibpath/dj-h5-0.1.2.css" />

<!-- after include angular.js  -->
<script src="yourlibpath/dj-h5-0.1.2.js"></script>
```


#### Use with Bower
add dependencies in `bower.json` like this:
```
  "dependencies": {
    "angular": "^1.6.1",
    "dj-h5": "0.1.0",
    //...
  }
```


#### incluce the angular modules as need

```
  angular.module('my-app', [
    'dj-login',
    'wx-jssdk',
    // ...
  ]);
```





