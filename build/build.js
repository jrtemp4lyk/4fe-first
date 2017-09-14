var fs = require('fs')
var path = require('path')
var ora = require('ora')
var rm = require('rimraf')
var cpr = require('cpr')
var cpr = require('cpr').cpr
var fis3 = require('fis3')
var execSync = require('child_process').execSync

var uglifyjs = require('uglify-js')
var CleanCSS = require('clean-css')
var cssMinify = new CleanCSS()
var crypto = require('crypto')

var pkg = require('../package.json')
var pkgName = pkg.name


var spinner = ora('building for production... \n')
spinner.start()

rm(path.resolve(__dirname, '../dist'), err => {
  if (err) {
    throw err
    spinner.stop()
    process.exit()
  }
  cpr(path.resolve(__dirname, '../src/assets/'), path.resolve(__dirname, '../dist/assets/'), {}, err => {
    if (err) {
      throw err
      spinner.stop()
      process.exit()
    }
    // 通过fis3将vue文件产出为js
    // execSync('fis3 release -d ./dist/' + pkgName + '/output')
    fis3.cli.run({
      _: ['release'],
      d: './dist/' + pkgName + '/output'

    }, {
      cwd: path.resolve(__dirname, '../'),
      configPath: path.resolve(__dirname, '../fis-conf.js'),
    })

    // 遍历pages下面的index.js，将对应的文件合并
    var srcBasePath = __dirname + '/../src/pages'
    var distBasePath = __dirname + '/../dist/' + pkgName
    var distPagesBasePath = __dirname + '/../dist/' + pkgName + '/pages'
    var distCommonBasePath = __dirname + '/../dist/' + pkgName + '/common'
    var outputBasePath = __dirname + '/../dist/' + pkgName + '/output'
    var outputPagesBasePath = __dirname + '/../dist/' + pkgName + '/output/pages'
    var relObj = {} // 用于产出config.js
    relArr = relObj[pkgName] = {}
    relArr['routers'] = []

    var parsePagesFile = function(curPath, name) {
      var filePath = path.join(srcBasePath, curPath, name)
      var state = fs.statSync(filePath)
      if (state.isDirectory()) {
        var dir = fs.readdirSync(filePath)
        if (name.length > 0) {
          curPath = curPath + '/' + name
        }
        dir.forEach((index) => {
          if (index != 'src')
            parsePagesFile(curPath, index)
        })
      } else if (name === 'index.js') {
        // console.log('get index.js in ' + curPath)
        buildPagesFile(curPath)
      }
    }
    var buildPagesFile = function(curPath) {
      // 合并目录下的文件
      var jsPath = path.join(distPagesBasePath, curPath + '.js')
      var cssPath = path.join(distPagesBasePath, curPath + '.css')

      fs.writeFileSync(jsPath, '')
      fs.writeFileSync(cssPath, '')
      concatFile(curPath, '', 'js')
      concatFile(curPath, '', 'css')
      // 压缩产出的js及css
      // var md5jsFileName = minJsFun(distPagesBasePath, curPath)
      // var md5cssFileName = minCssFun(distPagesBasePath, curPath)
      var md5jsFileName = md5Fun(distPagesBasePath, curPath, 'js')
      var md5cssFileName = md5Fun(distPagesBasePath, curPath, 'css')
      // 记录路由与js css的对应关系
      var routerFile = require(path.join(srcBasePath, curPath, 'index.js'))
      relArr[curPath.slice(1)] = {}
      relArr[curPath.slice(1)]['js'] = md5jsFileName.slice(1)
      relArr[curPath.slice(1)]['css'] = md5cssFileName.slice(1)
      for (var i in routerFile.routes) {
        routerFile.routes[i]['pkgName'] = pkgName
        routerFile.routes[i]['curPage'] = curPath.slice(1)
      }
      relArr['routers'] = relArr['routers'].concat(routerFile.routes)
    }


    var concatFile = function(srcBasePath, curPath, type) {
      var filePath = path.join(outputPagesBasePath, srcBasePath, curPath)
      var state = fs.statSync(filePath)
      if (state.isDirectory()) {
        var dir = fs.readdirSync(filePath)
        dir.forEach((index) => {
          concatFile(srcBasePath, curPath + '/' + index, type)
        })
      } else {
        if (endsWith(filePath, type) && !endsWith(curPath, 'index.js')) {
          // console.log('get (' + type + ') at :' + filePath)
          // console.log('srcBasePath:' + srcBasePath + '\n\n')
          var c = fs.readFileSync(filePath)
          var p
          if (type === 'js') {
            p = path.join(distPagesBasePath, srcBasePath + '.js')
          } else if (type === 'css') {
            p = path.join(distPagesBasePath, srcBasePath + '.css')
          }
          var b = fs.readFileSync(p)
          fs.writeFileSync(p, b.toString() + ' \n ' + c.toString())
        }
      }
    }
    var minJsFun = function(basePath, name) {
      var b = fs.readFileSync(path.join(basePath, name + '.js'))
      var minJs = uglifyjs.minify(b.toString())
      var md5js = crypto.createHash('md5')
      var md5jsStr = md5js.update(minJs.code).digest('hex')
      var md5jsFileName = name + '.' + md5jsStr + '.js'
      fs.writeFileSync(path.join(basePath, md5jsFileName), minJs.code)
      return md5jsFileName
    }

    var minCssFun = function(basePath, name) {
      var data = fs.readFileSync(path.join(basePath, name + '.css'))
      var minCss = cssMinify.minify(data.toString())
      var md5css = crypto.createHash('md5')
      var md5cssStr = md5css.update(minCss.styles).digest('hex')
      var md5cssFileName = name + '.' + md5cssStr + '.css'
      fs.writeFileSync(path.join(basePath, md5cssFileName), minCss.styles)
      return md5cssFileName
    }

    var md5Fun = function(basePath, name, type) {
      var b = fs.readFileSync(path.join(basePath, name + '.' + type))
      var md5js = crypto.createHash('md5')
      var md5jsStr = md5js.update(b.toString()).digest('hex')
      var md5jsFileName = name + '.' + md5jsStr + '.' + type
      fs.writeFileSync(path.join(basePath, md5jsFileName), b.toString())
      return md5jsFileName
    }
    var endsWith = function(str, endStr) {
      return str.slice(-endStr.length) == endStr
    }

    fs.mkdirSync(path.resolve(distPagesBasePath))
    // 处理output产出的pages
    parsePagesFile('', '')

    // 处理output其他的产出
    var parseOtherFile = function(curPath, name) {
      var filePath = path.join(outputBasePath, curPath, name)
      if (curPath === '/pages')
        return
      var state = fs.statSync(filePath)
      if (state.isDirectory()) {
        var dir = fs.readdirSync(filePath)
        if (name.length > 0) {
          curPath = curPath + '/' + name
        }
        dir.forEach((index) => {
          parseOtherFile(curPath, index)
        })
      } else {
        var c = fs.readFileSync(filePath)
        var p
        if (endsWith(filePath, 'js')) {
          p = path.join(distCommonBasePath, '/index.js')
        } else if (endsWith(filePath, 'css')) {
          p = path.join(distCommonBasePath, '/index.css')
        }
        if (p) {
          var b = fs.readFileSync(p)
          fs.writeFileSync(p, b.toString() + ' \n ' + c.toString())
        }

      }
    }
    fs.mkdirSync(path.resolve(distCommonBasePath))
    var commonJsPath = path.join(distCommonBasePath, '/index.js')
    var commonCssPath = path.join(distCommonBasePath, '/index.css')
    fs.writeFileSync(commonJsPath, '')
    fs.writeFileSync(commonCssPath, '')
    parseOtherFile('', '')

    // 压缩产出的js及css
    // var md5jsFileName = minJsFun(distCommonBasePath, '/index')
    // var md5cssFileName = minCssFun(distCommonBasePath, '/index')
    var md5jsFileName = md5Fun(distCommonBasePath, '/index', 'js')
    var md5cssFileName = md5Fun(distCommonBasePath, '/index', 'css')
    relArr['common'] = {}
    relArr['common']['js'] = md5jsFileName.slice(1)
    relArr['common']['css'] = md5cssFileName.slice(1)

    fs.writeFileSync(distBasePath + '/config.js', JSON.stringify(relObj))

    //调用rm存在问题因此直接调用系统命令
    // execSync('rm -rf ./dist/output')
    var emptyDir = function(fileUrl) {
      var files = fs.readdirSync(fileUrl); //读取该文件夹
      files.forEach(function(file) {
        var stats = fs.statSync(fileUrl + '/' + file);
        if (stats.isDirectory()) {
          emptyDir(fileUrl + '/' + file);
        } else {
          fs.unlinkSync(fileUrl + '/' + file);
          //  console.log("删除文件"+fileUrl+'/'+file+"成功");
        }
      });
    }
    var rmEmptyDir = function(fileUrl) {
      var files = fs.readdirSync(fileUrl);
      if (files.length > 0) {
        var tempFile = 0;
        files.forEach(function(fileName) {
          tempFile++;
          rmEmptyDir(fileUrl + '/' + fileName);
        });
        if (tempFile == files.length) { //删除母文件夹下的所有字空文件夹后，将母文件夹也删除
          fs.rmdirSync(fileUrl);
          // console.log('删除空文件夹'+fileUrl+'成功');
        }
      } else {
        fs.rmdirSync(fileUrl);
        // console.log('删除空文件夹'+fileUrl+'成功');
      }
    }
    emptyDir(path.resolve(__dirname, '../dist/' + pkgName + '/output/'));
    rmEmptyDir(path.resolve(__dirname, '../dist/' + pkgName + '/output/'));
    console.log('Build completed')
    spinner.stop()
    process.exit()
  });


});
