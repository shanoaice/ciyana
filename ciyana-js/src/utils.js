class UInt32 {
	constructor(value) {
		this.rawValue = value
		const hexString = `00000000${Math.abs(value).toString(16)}`.slice(-8)
		this.value = [
			hexString.slice(0, 2),
			hexString.slice(2, 4),
			hexString(4, 6),
			hexString(6),
		]
	}

	writev(buffer, offset = 0) {
		for (let i = 0; i < 4; i++) {
			buffer[offset + i] = this.value[i]
		}

		return buffer
	}
}

UInt32.fromBuffer = buffer =>
	Number.parseInt(`${buffer[0]}${buffer[1]}${buffer[2]}${buffer[3]}`, 16)

module.exports = {
	UInt32,
}
