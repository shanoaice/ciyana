const path = require('path')
const fs = require('fs/promises')
const hasher = require('@sindresorhus/fnv1a')
const extraHasher = require('djb2a')
const { functionalSwitch } = require('bethlehem')
const constants = require('./constants')
const { UInt32 } = require('./utils')

class KeyMap {
	constructor(path, maxWrap = 5, size = 32767) {
		this.majorCreated = false
		this.overflowMapCount = 0
		this.path = new Map()
		this.path.set('db', path)
		this.fileHandles = new Map()
		this.baseOffsets = new Map()
		this.maxWrap = maxWrap
		this.designatedSize = size
	}

	async initNewMap() {
		const mapName = this.majorCreated
			? `overflow${this.overflowMapCount++}`
			: 'major'
		this.path.set(mapName, `${mapName}.KEYMAP`)
		this.fileHandles.set(
			mapName,
			await fs.open(
				path.join(this.path.get('db'), this.path.get(mapName)),
				'w+'
			)
		)
		if (
			fs.existsSync(this.path.get(mapName)) &&
			(await this.fileHandles.get(mapName).read(Buffer.alloc(1)))
				.buffer[0] === constants.BEGIN_MAP_FLAG
		) {
			this.baseOffsets.set(
				mapName,
				UInt32.fromBuffer(
					(await this.fileHandles.get(mapName).read(Buffer.alloc(4)))
						.buffer
				)
			)
			const sizeTemporary = UInt32.fromBuffer(
				(await this.fileHandles.get(mapName).read(Buffer.alloc(4)))
					.buffer
			)
			if (sizeTemporary !== this.designatedSize) {
				console.warn(
					`Warning: Inconsistent designated and actual size of KeyMap, designated: ${this.designatedSize}, actual: ${sizeTemporary}`
				)
				console.warn(
					'Overriding designated size. If you think this is incorrect, please check your file integrity to prevent any errors.'
				)
			}

			this.size = sizeTemporary
		} else {
			this.size = this.designatedSize
			this.baseOffsets.set(mapName, null)
			const newMap = Buffer.alloc(
				constants.METADATA_SIZE + constants.DATA_CHUNK_SIZE * this.size
			)
			newMap[0] = constants.BEGIN_MAP_FLAG
			const length = new UInt32(this.size)
			length.writev(newMap, 5)
			await this.fileHandles.get(mapName).writeFile(newMap)
		}
	}

	async getKeyChunk(hash, extraHash, extra, currentMap, wrapCount = 0) {
		const getWrapFlag = functionalSwitch([
			{
				condition: keyPosition => keyPosition > this.size,
				task: () => constants.WRAP_FLAGS.FOW,
			},
			{
				condition: keyPosition => keyPosition >= 0,
				task: () => constants.WRAP_FLAGS.NUL,
			},
			{
				condition: () => true,
				task: () => constants.WRAP_FLAGS.REV,
			},
		])
		const getChunkPosition = functionalSwitch([
			{
				condition: keyPosition => keyPosition > this.size,
				task: keyPosition =>
					(keyPosition % this.size) * constants.DATA_CHUNK_SIZE,
			},
			{
				condition: keyPosition => keyPosition >= 0,
				task: keyPosition => keyPosition * constants.DATA_CHUNK_SIZE,
			},
			{
				condition: () => true,
				task: keyPosition =>
					(this.size - (Math.abs(keyPosition) % this.size)) *
					constants.DATA_CHUNK_SIZE,
			},
		])
		if (wrapCount > this.maxWrap)
			throw new Error('KeyMapError: Too many hash overflow wraps.')
		const keyHash = extra ? extraHash : hash
		const keyPosition = keyHash - this.baseOffsets.get(currentMap)
		const wrapFlag = getWrapFlag(keyPosition)
		const dataChunk = Buffer.alloc(constants.DATA_CHUNK_SIZE)
		await this.fileHandles
			.get(currentMap)
			.readv(
				dataChunk,
				getChunkPosition(keyPosition) + constants.METADATA_SIZE
			)
	}
}

module.exports = KeyMap
