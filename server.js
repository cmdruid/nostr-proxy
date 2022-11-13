import NostrEmitter from '@cmdcode/nostr-emitter'

import net from 'net'

const relayUrl = process.env.PROXY_RELAY_URL
const secret   = process.env.PROXY_SECRET_KEY

const delay = (ms = 1000) => new Promise((rs, _) => setTimeout(rs, ms))

let socketCache = {
  write  : () => console.log('Socket not initialized!'),
  pause  : () => console.log('Socket not initialized!'),
  resume : () => console.log('Socket not initialized!')
}

// creates the server
const server = net.createServer()
const emitter = new NostrEmitter()

emitter.on('newconn', () => {
  console.log('New nostr client connected!')
})

// emitter.on('data', (data) => {
//   console.log('Received data from emitter:', data)

//   const isBufferFull = socketCache.write(data)

//   if (isBufferFull) {
//     console.log('Data written from kernel buffer!')
//   } else {
//     console.log('Write buffer is full!')
//     socketCache.pause()
//   }
// })

server.on('close', () => {
  // Emitted when all connections are closed.
  console.log('Server closed!')
})

// emitted when new client connects
server.on('connection', (socket) => {
  // Emitted when a new client is connected.

  emitter.emit('newconn', 'connected!')

  const { 
    localPort, 
    localAddress, 
    remotePort, 
    remoteAddress, 
    remoteFamily,
    writableLength
  } = socket

  socketCache = socket

  emitter.on('data', (data) => {
    console.log('Received data from emitter:', data)

    const isBufferFull = socket.write(data)

    if (isBufferFull) {
      console.log('Data written from kernel buffer!')
    } else {
      console.log('Write buffer is full!')
      socket.pause()
    }
  })

  console.log('Buffer size : ' + writableLength)
  console.log('---------server details -----------------')

  const { port, family, ipAddr } = server.address()
  console.log('Server is listening at port' + port)
  console.log('Server ip :' + ipAddr)
  console.log('Server is IP4/IP6 : ' + family)
  console.log('Server is listening at LOCAL port' + localPort)
  console.log('Server LOCAL ip :' + localAddress)

  console.log('------------remote client info --------------')

  console.log('REMOTE Socket is listening at port ' + remotePort)
  console.log('REMOTE Socket ip : ' + remoteAddress)
  console.log('REMOTE Socket is IP4/IP6 : ' + remoteFamily)

  console.log('--------------------------------------------')

  server.getConnections( (error, count) => {
    console.log('Number of concurrent connections to the server : ' + count)
  })

  // Set the character encoding.
  socket.setEncoding('utf8')


  socket.setTimeout(800000, () => {
    // Same as socket.on('timeout')
    console.log('Socket timed out')
  })

  socket.on('data', async (data) => {
    const { bytesRead, bytesWritten } = socket

    console.log('Received data from socket:', data)
    console.log('Bytes read:', bytesRead)
    console.log('Bytes written:', bytesWritten)
    
    emitter.emit('data', data)
  })

  socket.on('drain', () => {
    console.log('Write buffer now empty!')
    socket.resume()
  })

  socket.on('error', (error) => {
    console.log('Error : ' + error)
  })

  socket.on('timeout', () => {
    console.log('Socket timed out!')
    socket.end('Timed out!')
    // or call socket.destroy().
  })

  socket.on('end', (data) => {
    console.log('Client terminated socket!');
    console.log('End data:', data)
  })

  socket.on('close', (error) => {
    const { bytesRead, bytesWritten } = socket

    console.log('Bytes read:', bytesRead)
    console.log('Bytes written:', bytesWritten)
    console.log('Socket closed!')

    if (error) {
      console.log('Transmission error:', error)
    }
  })

  setTimeout( () => {
    const isdestroyed = socket.destroyed;
    console.log('Socket destroyed:' + isdestroyed);
    socket.destroy()
  }, 1200000)
})

server.on('error', (error) => {
  console.log('Error:', error)
})

server.on('listening', async () => {
  console.log('Server is listening!')
  await emitter.connect(relayUrl, secret)
})

server.maxConnections = 10

server.listen(9886)

// // for dyanmic port allocation
// server.listen(function(){
//   var address = server.address();
//   var port = address.port;
//   var family = address.family;
//   var ipaddr = address.address;
//   console.log('Server is listening at port' + port);
//   console.log('Server ip :' + ipaddr);
//   console.log('Server is IP4/IP6 : ' + family);
// });

setTimeout( () => {
  server.close()
}, 5000000)
