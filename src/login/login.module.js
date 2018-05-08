!(function (angular, window, undefined) {
  
  angular.module('dj-login', ['ngRoute', 'dj-wx'])

  var theSiteConfig = window.theSiteConfig = angular.extend({
    localStorage_KEY_UserToken: '__jdyhy_user_token__'
  }, window.theSiteConfig);


  var userToken = {
    data: {},
    load: () => {
      var k = theSiteConfig.localStorage_KEY_UserToken;
      userToken.data = JSON.parse(localStorage.getItem(k) || '{}');
      return userToken;
    },
    /** 保存到 */
    save: (data) => {
      var k = theSiteConfig.localStorage_KEY_UserToken;
      localStorage.removeItem(k);
      localStorage.setItem(k, JSON.stringify(userToken.data = data));
    },
    hasToken: () => {
      return userToken.data && userToken.data.tokenid && userToken.data.token;
    },
    /** 校准与服务器的时间偏差 */
    timestampOffset: 0, // 时间偏差
    adjustTimestamp: (timestampServer) => {
      var dt = new Date();
      var timestampHere = Math.round((dt.getTime() / 1000));
      userToken.timestampOffset = timestampServer - timestampHere;
    },
    signToken: () => {
      userToken.load()
      var tokenid = userToken.data.tokenid;
      var token = userToken.data.token;
      if (!tokenid || !token) {
        return {};
      }
      var dt = new Date();
      var timestamp = Math.round((dt.getTime() / 1000));
      timestamp += userToken.timestampOffset; // 修正误差
      var sign = md5(token + timestamp);
      return { tokenid, timestamp, sign };
    },
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
        save  : saveUserToken
      };
    };
  })
})(angular, window);
