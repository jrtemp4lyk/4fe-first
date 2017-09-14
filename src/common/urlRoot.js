/**
 * Created by Administrator on 2017/5/19.
 */

export default {
  /**
   * url请求统一入口
   * @param url
   * @returns {string}
   */
  urlWepper: function(url){
    var urlroot = window.ctxs.fin;
    if(url.indexOf('/') === 0){
      urlroot += url;
    }else {
      urlroot = urlroot + '/' + url;
    }
    return urlroot;
  },
};

