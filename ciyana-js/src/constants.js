const METADATA_SIZE = 9

const DATA_CHUNK_SIZE = 13

const WRAP_FLAGS = {
	NUL: 0xcc,
	FOW: 0xcb,
	REV: 0xcd,
}
const WRAP_COUNT_SIZE = 2

const VALUE_INDEX_SIZE = 4

const EXTRA_HASH_SIZE = 4

const BEGIN_MAP_FLAG = 0xca

module.exports = {
	METADATA_SIZE,
	BEGIN_MAP_FLAG,
	DATA_CHUNK_SIZE,
	WRAP_FLAGS,
	WRAP_COUNT_SIZE,
	VALUE_INDEX_SIZE,
	EXTRA_HASH_SIZE,
}
