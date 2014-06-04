var crypto = require('crypto');
var path = require("path");
var through = require('through2');
var gulp = require('gulp');
var fs = require('fs');

module.exports = function(options) {
    options = options || {};

    return function() {
        var bundleName = options.name;
        var files = [], res = {};

        options.files.forEach(function(file) {
            files.push(path.join(options.bundleDir ||  'bundles', bundleName, file))
        });

        var freeze = gulp.src(files)
            .pipe(freezeBundle(res))
            .pipe(gulp.dest(options.freezePath || 'public/static'));

        freeze.on('end', function() {
            var output = path.join(options.outputDir || '', bundleName + '.bundle.json');

            res.css = res.css.map(function(item) { return { elem: 'css', url:  getUrlPath(item, options) } });
            res.js = res.js.map(function(item) { return { elem: 'js', url:  getUrlPath(item, options)} });

            res.bh = path.join(options.bundleDir ||  'bundles', bundleName, options.bhFile);
            fs.writeFileSync(output, JSON.stringify(res),'utf8');

            console.log(['[', new Date().toTimeString(), ']', ' Serve bundle ', options.name, ' finished ...'].join(''));
        });

    };
};

function freezeBundle(result, options) {
    options = options || {};

    return through.obj(function(file, enc, done) {
        if (file.isBuffer()) {
            var content = file.contents.toString('utf-8');
            var checksum = crypto.createHash('md5').update(content, "utf8").digest("hex");

            file.path = getOutputPath(file.path, checksum);
        }


        this.push(file);
        done();
    });

    function getOutputPath(filepath, checksum) {
        var suffix = path.extname(filepath).replace(/^./, '');
        var filename  = checksum + '.' + suffix;

        (result[suffix] || (result[suffix] = [])).push(filename);

        return path.dirname(filepath) + '/' + filename;
    }
}

function getUrlPath(file, options) {
    var staticDir = '/' + (options.staticDir || '').replace(/^\/+|\/+$/g, '');
    var cdn = (options.cdn || '').replace(/\/+$/, '');

    return cdn + staticDir + '/' + file;
}

