var fs = require('fs');

function append(filename, data, callback) {
    fs.appendFile( filename, data, callback);
}

function execute(cmd, outfile, errfile) {
    var cmdStr = '[' + cmd + ']';
    var startStr = '>>>>>>>>>process started.';
    var endStr = '>>>>>>>>>process stopped.';

    if (outfile) {
        append(outfile, cmdStr, function(err) {
            if (err) {
                console.log('out log error.');
            }
        });
        append(outfile, startStr, function(err) {
            if (err) {
                console.log('out log error.');
            }
        });
    } else {
        console.log(cmdStr);
        console.log(startStr);
    }

    var spawn = require('child_process').spawn;

    var h = spawn(cmd);

    h.stdout.on('data', function (s) {
        if (out) {
            append(out, s, function(err) {
                if (err) {
                    console.log('out log error.');
                }
            });
        } else {
            console.log(s.toString());
        }
    });

    h.stdout.on('end', function () {
        if (out) {
            append(out, endStr, function(err) {
                if (err) {
                    console.log('out log error.');
                }
            });
        } else {
            console.log(endStr);
        }
    });

    // h.stderr.on('data', function (s) {
    //     if (out) {
    //         append(err, s, function(err) {
    //             if (err) {
    //                 console.log('err log error.');
    //             }
    //         });
    //     } else {
    //         console.log(s.toString());
    //     }
    // });
    //
    // h.stderr.on('end', function () {
    //     if (err) {
    //         append(err, endStr, function(err) {
    //             if (err) {
    //                 console.log('err log error.');
    //             }
    //         });
    //     } else {
    //         console.log(endStr);
    //     }
    // });
}

exports.execute = execute;