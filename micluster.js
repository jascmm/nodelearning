var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;

var rssWarn = (12 * 1024 * 1024)
  , heapWarn = (10 * 1024 * 1024);


var workers = {}

if (cluster.isMaster){
	
	for (var i=0; i<numCPUs; i++){
		createWorker();
	}
	setInterval(function(){
		var time = new Date().getTime();
		for (pid in workers){
			if (workers.hasOwnProperty(pid) && workers[pid].lastCb + 5000 < time) {
				console.log('Long running worker ' + pid + ' killed');
				workers[pid].worker.kill();
				delete workers[pid];
				createWorker();
			}
		}
	}, 1000);
} else {
	// Server
	http.Server(function(req, res){
		// mess up 1 in 200 reqs
        if (Math.floor(Math.random() * 200) === 4) {
        	console.log('Stopped ' + process.pid + ' from ever finishing')
        	while (true) {continue};
        }
		res.writeHead(200);
		res.end('Hello world');
	}).listen(8000);


	function createWorker(){
		var worker = cluster.fork();


		console.log('Created worker: ' +  worker.pid);
		// allow boot time
		workers[worker.pid] = {worker:worker, lastCB:new Date().getTime()-1000};
		worker.on('message', function(m) {
			if (m.cmd === "reportMem") {
				workers[m.process].lastCb = new Date().getTime();
				if (m.memory.rss > rssWarn){
					console.log('Worker ' + m.process + ' using too much memory');
				}
			}
		})
	}
} 
