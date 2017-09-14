## 介绍

本仓库为与ap-fe-optimze配套的项目工程模板。

## 文件说明
```
│  app.js // koa服务配置
│  fis-conf.js // fis3配置
│  gulpfile.js //gulp配置
│  package.json // 项目配置
│  README.md // 说明文件
│  
├─build
│      build.js // 产出dist目录
│      
├─config
│      config.js // 配置文件
│      
└─src  // 项目源文件，主要修改内容
    ├─common // 公共js需放入此文件夹下
    │      
    └─pages // 具体功能源码
        │  
        └─crm // 模块名称
           │  index.js // 路由配置
           │  
           └─src // 功能源码
                  crmList.vue
                  enterpriseInfo.vue
                  personalDetail.vue
                  personalInfo.vue
```
#### 注意点：
* 以下文件尽量不要修改
  * app.js
  * fis-conf.js
  * gulpfile.js
  * build/build.js
* 以下文件根据实际情况修改
  * config.js
* 以下文件必须修改
  * package.json
    * name：需要与ap-fe-optimze工程src/App.vue文件中请求(window.ctxs.ap + '/appMGT/appCenter/allList?showway=apparea&areaId=&groupId=')返回模块的areaKey值保持一致
    * dependencies中的vue需要按版本保留，其他内容按需加载
## 开发说明

在开发过程中本地仅启动项目工程，测试服务器启动公共的平台服务。

### 修改config.js
按照实际情况修改proxyList下平台服务以及后台服务的地址及url的匹配规则。

### 启动服务

可通过以下方式启动服务
```
$ gulp
```
或者
```
npm run dev
```

由于目前存在问题，需先通过地址：http://localhost:7020/wbalone/sso/login?tenantId=wbalone_fin&loginname=yajun.you 来进行登录

### 线上部署

将产出的dist目录进行部署，并且保证线上服务可通过下面的地址找到对应文件

ip+port + '/ifbp-fe/config.js'
