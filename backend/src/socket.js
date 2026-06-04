/**
 * Socket.io singleton — lets controllers emit events without circular imports.
 * Call setIo(io) once in index.js after creating the Server instance.
 */
let _io = null;

const setIo = (io) => { _io = io; };
const getIo = () => _io;

module.exports = { setIo, getIo };
