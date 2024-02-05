const PORT = 35729
const autoreloadSource = new EventSource(`http://localhost:${PORT}`)

autoreloadSource.addEventListener("reload", () => {
	window.location.reload()
})
