!(function (window, angular, undefined) {

  var idWxLoginDiv = 'wx-lg_cnt_' + (+new Date());
  var isWx = (/micromessenger/i).test(navigator.userAgent);


  angular.module('dj-wx')

    .config(['$sceDelegateProvider', function ($sceDelegateProvider) {
      var oldList = $sceDelegateProvider.resourceUrlWhitelist();
      oldList.push('https://res.wx.qq.com/**');
      $sceDelegateProvider.resourceUrlWhitelist(oldList);
    }])
    .component('loginWxAuth', {
      template: `<div id="${idWxLoginDiv}" class="text-center">Loading weixin ...</div>`,
      bindings: {
        pageTo: '<'
      },
      controller: ['$scope', '$location', '$http', ctrl]
    });

  function ctrl($scope, $location, $http) {
    if (isWx) {
      /**
       * 微信浏览器中，网页授权登录
       * 在 angular.module 启动前, angular.dj.wxAuth.authUrl() 函数可用
       */
      var pageTo = this.pageTo;
      if (/^\/login(\/.*)?$/.test(pageTo)) pageTo = '/';

      var auhParam = getAuhParam(location.href, pageTo, 'wx');
      var wxAuthUrl =
        'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + auhParam.appid +
        '&redirect_uri=' + auhParam.redirect_uri +
        '&response_type=code&scope=snsapi_userinfo&state=' + auhParam.state +
        '#wechat_redirect';

      location.href = wxAuthUrl;
      return;
    }
    this.$onInit =  () => {
      console.log("pageTo=", this.pageTo);
      var auhParam = getAuhParam(location.href, this.pageTo, 'web');
      var wx_src = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";
      if (typeof (WxLogin) == 'undefined') {
        $http.jsonp(wx_src).finally(json => {
          showWxLogin(auhParam);
        });
      } else {
        showWxLogin(auhParam);
      }
    }
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
    var loginHash = (/\#\!/.test(window.location.hash) ? "#!":"#") + "/wx-code-login";
    var theSiteConfig = angular.extend({}, window.theSiteConfig);
    var appid = theSiteConfig.wx_app[appName].appid;
    var state = encodeURIComponent(btoa(hash));
    var para1 = theSiteConfig.wx_app[appName].name;
    var para2 = encodeURIComponent(btoa(href.split("#")[0] + loginHash));

    var redirect_uri = `${theSiteConfig.wx_authApiBase}/${para1}/${para2}`;
    return {
      appid,
      state,
      redirect_uri
    }
  }

})(window, angular);
