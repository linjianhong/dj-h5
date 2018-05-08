'use strict';

!function (angular, window, undefined) {
  // 只在微信浏览器中运行
  // @var useWX: 是否应该使用微信 JSSDK
  var isWx = /micromessenger/i.test(navigator.userAgent);
  var useWX = location.origin.length > 12 && location.origin.indexOf('192.168') < 0 && isWx;
  var _initWx;
  var theModule = angular.module('wx-jssdk', []);
  var theCounter = 80000;

  /** 微信 JSSDK 初始化 */
  theModule.run(['$http', '$q', function ($http, $q) {

    _initWx = function initWx() {
      // 只在微信浏览器中运行
      if (!useWX) return $q.reject('not wx');
      if (_initWx.promise) {
        return $q.when(_initWx.promise);
      }

      var deferred = $q.defer();
      var wx_app_name = window.theSiteConfig && window.theSiteConfig.wx_app.wx.name || 'pgy-wx';
      var url = location.href.split('#')[0];

      $http.post("app/jsapi_sign", { name: wx_app_name, url: encodeURIComponent(url) }).then(function (json) {
        var config = json.datas.config;
        if (!config) {
          deferred.reject('config error!');
          return;
        }
        wx.config({
          debug: false,
          appId: config.appId,
          timestamp: config.timestamp,
          nonceStr: config.nonceStr,
          signature: config.signature,
          jsApiList: [
          // 所有要调用的 API 都要加到这个列表中
          'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone', 'startRecord', 'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'pauseVoice', 'stopVoice', 'onVoicePlayEnd', 'uploadVoice', 'downloadVoice', 'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'translateVoice', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem', 'showAllNonBaseMenuItem', 'closeWindow', 'scanQRCode', 'chooseWXPay']
        });

        wx.ready(function () {
          deferred.resolve(_initWx.promise = wx);
        });
      }).catch(function (e) {
        deferred.reject('getWjSign error!');
      });

      return _initWx.promise = deferred.promise;
    };
  }]);

  /** 提供 JSSDK 功能 */
  theModule.run(['$rootScope', '$http', '$q', 'sign', function ($rootScope, $http, $q, sign) {

    /**
     * 请求二维码扫描
     */
    sign.registerHttpHook({
      match: /^扫描二维码$/,
      hookRequest: function hookRequest(config, mockResponse) {
        var deferred = $q.defer();
        _initWx().then(function (wx) {
          wx.scanQRCode({
            needResult: 1, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
            scanType: ["qrCode", "barCode"], // 可以指定扫二维码还是一维码，默认二者都有
            success: function success(res) {
              var result = res.resultStr; // 当needResult 为 1 时，扫码返回的结果
              console.log('扫描结果 = ', result);
              deferred.resolve(result);
            },
            fail: function fail(res) {
              deferred.reject(res);
            }
          });
        }).catch(function (e) {
          deferred.resolve('10' + ++theCounter);
          //deferred.reject(e);
          //console.log("请求二维码扫描错误", e);
        });
        return mockResponse.resolve(deferred.promise);
      }
    });

    /**
     * 请求二维码扫描（模拟，用于调试）
     */
    sign.registerHttpHook({
      match: /^模拟扫描二维码$/,
      hookRequest: function hookRequest(config, mockResponse) {
        var deferred = $q.defer();
        window.setTimeout(function () {
          console.log('模拟扫描结果 = ', config.data || '模拟数据');
          deferred.resolve(config.data || '模拟数据');
        }, 120);
        return mockResponse.resolve(deferred.promise);
      }
    });
  }]);
}(angular, window);

!function (angular, window, undefined) {

  angular.module('dj-login', ['ngRoute', 'dj-wx']);

  var theSiteConfig = window.theSiteConfig = angular.extend({
    localStorage_KEY_UserToken: '__jdyhy_user_token__'
  }, window.theSiteConfig);

  var userToken = {
    data: {},
    load: function load() {
      var k = theSiteConfig.localStorage_KEY_UserToken;
      userToken.data = JSON.parse(localStorage.getItem(k) || '{}');
      return userToken;
    },
    /** 保存到 */
    save: function save(data) {
      var k = theSiteConfig.localStorage_KEY_UserToken;
      localStorage.removeItem(k);
      localStorage.setItem(k, JSON.stringify(userToken.data = data));
    },
    hasToken: function hasToken() {
      return userToken.data && userToken.data.tokenid && userToken.data.token;
    },
    /** 校准与服务器的时间偏差 */
    timestampOffset: 0, // 时间偏差
    adjustTimestamp: function adjustTimestamp(timestampServer) {
      var dt = new Date();
      var timestampHere = Math.round(dt.getTime() / 1000);
      userToken.timestampOffset = timestampServer - timestampHere;
    },
    signToken: function signToken() {
      userToken.load();
      var tokenid = userToken.data.tokenid;
      var token = userToken.data.token;
      if (!tokenid || !token) {
        return {};
      }
      var dt = new Date();
      var timestamp = Math.round(dt.getTime() / 1000);
      timestamp += userToken.timestampOffset; // 修正误差
      var sign = md5(token + timestamp);
      return { tokenid: tokenid, timestamp: timestamp, sign: sign };
    }
  };
  /**
   * 基本的用户登录票据和签名方法
   */
  function getUserToken() {
    userToken.load();
    return userToken;
  }
  function saveUserToken(data) {
    userToken.save(data);
    return userToken;
  }
  window.theSiteConfig.getUserToken = getUserToken;

  /**
   * 基本的用户登录票据和签名方法, 转换为工厂
   */
  angular.module('dj-login').provider("UserToken", function () {

    this.reload = getUserToken;
    /**
     * 暴露数据
     */
    this.$get = function () {
      return {
        reload: getUserToken,
        save: saveUserToken
      };
    };
  });
}(angular, window);

!function () {

  angular.module('dj-wx', ['ngRoute']);
}();

!function (window, angular, undefined) {

  var idWxLoginDiv = 'wx-lg_cnt_' + +new Date();
  var isWx = /micromessenger/i.test(navigator.userAgent);

  angular.module('dj-login').component('loginHost', {
    template: '',
    bindings: {
      mode: '<',
      pageTo: '<'
    },
    controller: ['$scope', '$element', '$compile', ctrl]
  });

  function ctrl($scope, $element, $compile) {
    var _this = this;

    this.$onInit = function (a, b, c) {
      var eleName = 'login-' + _this.mode;
      $element.html('<' + eleName + ' page-to="$ctrl.pageTo"></' + eleName + '>');
      $compile($element.contents())($scope);
    };
  }
}(window, angular);

/**
 * 项目详情页面
 * ver: 0.0.1
 * build: 2017-12-20
 * power by LJH.
 */
!function (window, angular, undefined) {

  angular.module('dj-login').config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/login', {
      redirectTo: '/login/wx-auth'
    }).when('/login-test', {
      pageTitle: "登录测试",
      requireLogin: false,
      template: '登录测试'
    }).when('/login/:login_mode', {
      pageTitle: "登录",
      requireLogin: false,
      template: '<login-host mode="loginMode" page-to="pageTo"></login-host>',
      controller: ['$scope', '$routeParams', '$location', ctrl]
    });
  }]);

  function ctrl($scope, $routeParams, $location) {
    $scope.loginMode = $routeParams.login_mode || 'wx-auth';
    $scope.pageTo = $location.search().pageTo;
  }
}(window, angular);
!function (window, angular, undefined) {

  var idWxLoginDiv = 'wx-lg_cnt_' + +new Date();
  var isWx = /micromessenger/i.test(navigator.userAgent);

  angular.module('dj-wx').config(['$sceDelegateProvider', function ($sceDelegateProvider) {
    var oldList = $sceDelegateProvider.resourceUrlWhitelist();
    oldList.push('https://res.wx.qq.com/**');
    $sceDelegateProvider.resourceUrlWhitelist(oldList);
  }]).component('loginWxAuth', {
    template: '<div id="' + idWxLoginDiv + '" class="text-center">Loading weixin ...</div>',
    bindings: {
      pageTo: '<'
    },
    controller: ['$scope', '$location', '$http', ctrl]
  });

  function ctrl($scope, $location, $http) {
    var _this2 = this;

    if (isWx) {
      /**
       * 微信浏览器中，网页授权登录
       * 在 angular.module 启动前, angular.dj.wxAuth.authUrl() 函数可用
       */
      var pageTo = this.pageTo;
      if (/^\/login(\/.*)?$/.test(pageTo)) pageTo = '/';

      var auhParam = getAuhParam(location.href, pageTo, 'wx');
      var wxAuthUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + auhParam.appid + '&redirect_uri=' + auhParam.redirect_uri + '&response_type=code&scope=snsapi_userinfo&state=' + auhParam.state + '#wechat_redirect';

      location.href = wxAuthUrl;
      return;
    }
    this.$onInit = function () {
      console.log("pageTo=", _this2.pageTo);
      var auhParam = getAuhParam(location.href, _this2.pageTo, 'web');
      var wx_src = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";
      if (typeof WxLogin == 'undefined') {
        $http.jsonp(wx_src).finally(function (json) {
          showWxLogin(auhParam);
        });
      } else {
        showWxLogin(auhParam);
      }
    };
    function showWxLogin(auhParam) {
      new WxLogin(angular.extend({}, auhParam, {
        id: idWxLoginDiv,
        scope: "snsapi_login",
        style: "",
        href: ""
      }));
    }
  }

  /**
   * 获取微信二维码登录参数
   * @param {string} href : 登录成功后，将跳转到的页面, hash 部分无效，且自动添加#!/wx-code-login
   * @param {string} hash : 在 wx-code-login 调用成功后，将跳转到的页面
   * @param {string} appName : 第三方授权的微信公众号自定义名称，前后端约定
   */
  function getAuhParam(href, hash, appName) {
    var loginHash = (/\#\!/.test(window.location.hash) ? "#!" : "#") + "/wx-code-login";
    var theSiteConfig = angular.extend({}, window.theSiteConfig);
    var appid = theSiteConfig.wx_app[appName].appid;
    var state = encodeURIComponent(btoa(hash));
    var para1 = theSiteConfig.wx_app[appName].name;
    var para2 = encodeURIComponent(btoa(href.split("#")[0] + loginHash));

    var redirect_uri = theSiteConfig.wx_authApiBase + '/' + para1 + '/' + para2;
    return {
      appid: appid,
      state: state,
      redirect_uri: redirect_uri
    };
  }
}(window, angular);

/**
 * 微信code登录页面
 * ver: 0.0.1
 * build: 2017-12-20
 * power by LJH.
 */
!function (window, angular, undefined) {

  angular.module('dj-wx').config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/wx-code-login', {
      pageTitle: "微信code登录",
      requireLogin: false,
      template: '正在登录中...',
      controller: ['$scope', '$location', '$http', 'UserToken', ctrl]
    });
  }]);

  function ctrl($scope, $location, $http, UserToken) {
    var search = $location.search();
    $http.post('app/wx_code_login', {
      name: search.app,
      scene: search.scene, // 小程序传递过来的参数
      code: search.code
    }, {
      hook: { hookRequest: 'url' }
    }).then(function (json) {
      UserToken.save(json.datas);
      $http.post("用户登录", { token: json.datas });
      location.hash = (/\#\!/.test(window.location.hash) ? "#!" : "#") + search.pageTo;
      //$location.path( search.pageTo ).search({});
    }).catch(function (json) {
      console.log('静态api, 拒绝', json);
    });
  }
}(window, angular);