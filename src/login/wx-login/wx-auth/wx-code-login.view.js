/**
 * 微信code登录页面
 * ver: 0.0.1
 * build: 2017-12-20
 * power by LJH.
 */
!(function (window, angular, undefined) {

  angular.module('dj-wx')
    .config(['$routeProvider', function ($routeProvider) {
      $routeProvider
        .when('/wx-code-login', {
          pageTitle: "微信code登录",
          requireLogin: false,
          template: '正在登录中...',
          controller: ['$scope', '$location', '$http', 'UserToken', ctrl]
        });
    }]);

  function ctrl($scope, $location, $http, UserToken) {
    var search = $location.search();
    $http.post('app/wx_code_login',{
      name: search.app,
      scene: search.scene, // 小程序传递过来的参数
      code: search.code
    },{
      hook: {hookRequest: 'url'}
    }).then(json => {
      UserToken.save(json.datas);      
      $http.post("用户登录", {token: json.datas});
      location.hash = (/\#\!/.test(window.location.hash) ? "#!":"#") + search.pageTo;
      //$location.path( search.pageTo ).search({});
    }).catch(json =>{
      console.log('静态api, 拒绝', json);
    });

  }
})(window, angular);