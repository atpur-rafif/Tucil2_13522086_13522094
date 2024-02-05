const chokidar = require("chokidar")
const path = require("path")
const fs = require("fs")
const esbuild = require("esbuild")

const sourceDir = path.resolve(__dirname, "src")
const distDir = path.resolve(__dirname, "dist")

const ignoreCallback = () => { }

const useDebug = true;
function debug(value) {
	if (!useDebug) return
	console.log(value)
}

// Sync file
fs.mkdir(distDir, ignoreCallback)
chokidar.watch(sourceDir)
	.on("all", (eventName, source) => {
		if (source.endsWith(".ts")) return

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

// Server
esbuild.context({
	entryPoints: ["src/server/index.ts"],
	format: "cjs",
	outdir: "dist/server"
}).then(ctx => {
	ctx.watch()
})

// Client
esbuild.context({
	entryPoints: ["src/client/index.ts"],
	bundle: true,
	outdir: "dist/client"
}).then(ctx => {
	ctx.watch()
})

