const koa = require('koa');
const config = require('./config/config');
const cors = require('koa-cors');
const bodyParser = require('koa-bodyparser');
const proxy = require('koa-better-http-proxy');
const proxyList = config.proxyList;

const app = new koa();


// 使用ctx.body解析中间件
app.use(bodyParser())
// 支持跨域
app.use(cors());
// 指定静态资源路径
app.use(require('koa-static')(__dirname + config.static_path));
app.use(require('koa-static')(__dirname + '/devStatic'));

// 代码
proxyList.forEach(function(config) {
    app.use(proxy(config.host, config.options));
    // console.log('Proxy :', '\x1b[33m', ' -> ', config.host, '\x1b[0m', ' Started.');
});

app.listen(config.port);

// 如果两个服务的话使用gulp启动自动刷新会存在问题，因此合并至一个
var execSync = require('child_process').execSync;
execSync('npm run build');
