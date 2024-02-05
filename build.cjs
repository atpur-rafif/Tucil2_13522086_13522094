const chokidar = require("chokidar")
const path = require("path")
const fs = require("fs")

const sourceDir = path.resolve(__dirname, "src")
const distDir = path.resolve(__dirname, "dist")

const ignoreCallback = () => { }
fs.mkdir(distDir, ignoreCallback)

const useDebug = true;
function debug(value) {
	if (!useDebug) return
	console.log(value)
}

chokidar.watch(sourceDir)
	.on("all", (eventName, source) => {
		const relative = path.relative(sourceDir, source)
		const dist = path.resolve(distDir, relative)
		const ignoreCallback = () => { }
		if (eventName == "addDir") {
			fs.mkdir(dist, ignoreCallback)
			if (source == sourceDir) debug("Created base directory")
			else debug(`Created directory: ${relative}`)
		} else if (eventName == "unlinkDir") {
			fs.rmdir(dist, ignoreCallback)
			debug(`Removed directory: ${relative}`)
		} else if (eventName == "add" || eventName == "change") {
			fs.copyFile(source, dist, ignoreCallback)
			debug(`Copied file: ${relative}`)
		} else if (eventName == "unlink") {
			fs.unlink(dist, ignoreCallback)
			debug(`Removed file: ${relative}`)
		}
	})
