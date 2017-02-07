class IO {
	setSocketIo (io) {
		this._io = io;

		io.on('connection', function (socket) {
			console.log('user connected', socket.id);
		});
	}

	getSocketIo () {
		return this._io;
	}
}

module.exports = new IO();