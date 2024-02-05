const http = require('http')
const path = require('path')
const fs = require('fs')

const hostname = "localhost"
const port = 80;

const serverDir = __dirname
const clientDir = path.resolve(serverDir, "..", "client")

const server = http.createServer((req, res) => {
	const relative = path.relative("/", req.url)
	const resourceFile = path.resolve(clientDir, relative)

	let file;
	try {
		file = fs.readFileSync(resourceFile, "utf8")
	} catch (error) {
		res.statusCode = 404
		res.end("Resource not found\n")
		return
	}

	res.statusCode = 200;
	res.end(file);
});

server.listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});
