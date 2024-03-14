const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");
const http = require("http");

const sourceDir = path.resolve(__dirname, "src");
const distDir = path.resolve(__dirname, "dist");

const ignoreCallback = () => {};

const useDebug = true;
function debug(value) {
	if (!useDebug) return;
	console.log(value);
}

// Autoreload

/** @type http.ServerResponse[] */
const clients = [];
const AUTORELOAD_PORT = 35729;
const autoreloadServer = http.createServer((req, res) => {
	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
	clients.push(res);
	req.on("close", () => {
		const idx = clients.indexOf(res);
		clients.splice(idx, 1);
	});
});
autoreloadServer.listen(AUTORELOAD_PORT);

const reload = () => {
	clients.forEach((client) => {
		client.write("event: reload\ndata: \n\n");
	});
};

// Sync file
fs.mkdir(distDir, ignoreCallback);
chokidar.watch(sourceDir).on("all", (eventName, source) => {
	const ignore = ["ts", "tsx", "js", "jsx", "css"];
	if (ignore.reduce((prev, ext) => prev || source.endsWith(ext), false)) return;

	const relative = path.relative(sourceDir, source);
	const dist = path.resolve(distDir, relative);
	const cb = () => {
		reload();
	};
	if (eventName == "addDir") {
		fs.mkdir(dist, cb);
		if (source == sourceDir) debug("Created base directory");
		else debug(`Created directory: ${relative}`);
	} else if (eventName == "unlinkDir") {
		fs.rmdir(dist, cb);
		debug(`Removed directory: ${relative}`);
	} else if (eventName == "add" || eventName == "change") {
		fs.copyFile(source, dist, cb);
		debug(`Copied file: ${relative}`);
	} else if (eventName == "unlink") {
		fs.unlink(dist, cb);
		debug(`Removed file: ${relative}`);
	}
});

/** @type esbuild.Plugin */
const esbuildPlugin = {
	name: "debug",
	setup(build) {
		build.onStart(() => {
			debug("Rebuilding script...");
		});

		build.onEnd(() => {
			reload();
		});
	},
};

// Server
esbuild
	.context({
		entryPoints: ["src/server/index.ts"],
		format: "esm",
		outdir: "dist/server",
		plugins: [esbuildPlugin],
	})
	.then((ctx) => {
		ctx.watch();
	});

// Client
esbuild
	.context({
		entryPoints: ["src/client/index.ts"],
		bundle: true,
		outdir: "dist/client",
		plugins: [esbuildPlugin],
	})
	.then((ctx) => {
		ctx.watch();
	});
