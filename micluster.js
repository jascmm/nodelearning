var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

var rssWarn = (12 * 1024 * 1024)
  , heapWarn = (10 * 1024 * 1024);


if (cluster.isMaster){
	console.log(numCPUs);
	for (var i=0; i<numCPUs; i++){
		var worker = cluster.fork();
		worker.on('message', function(m){
			if (m.memory){
				if (m.memory.rss > rssWarn){
					console.log('Worker ' + m.process + ' using too much memory.' + m.memory.rss);
				}
			}
		})
	}
} else {
	// Server
	http.Server(function(req, res){
		res.writeHead(200);
		res.end('Hello world');
	}).listen(8000);

	setInterval(function report(){
		process.send({memory: process.memoryUsage(), process: process.pid});
	})
}
